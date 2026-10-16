import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";
import { upsertResilient } from "../_db";
import { SAVE_TABLES, bodyTooLarge, sanitizeRow } from "../_validate";
import { audit, auditEventFromReq } from "@/lib/audit";

/** 512KB per row-write — dashboard rows are kilobytes; anything bigger is abuse. */
const BODY_CAP = 512 * 1024;

function gateError(gate: { status: number; error: string; retryAfterSec?: number }): NextResponse {
  const headers = gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined;
  return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
}

/** Log a failed admin attempt (append-only audit) then build the response. */
function auditFail(
  ev: ReturnType<typeof auditEventFromReq>,
  error: string,
  status = 400,
): NextResponse {
  ev.ok = false;
  ev.error = error;
  void audit(ev);
  return NextResponse.json({ error }, { status });
}

/** Upsert one row — every dashboard create/edit lands here (service_role). */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  const ev = auditEventFromReq(req, "save");
  if (!gate.ok) {
    ev.ok = false;
    ev.error = gate.error;
    void audit(ev);
    return gateError(gate);
  }

  if (bodyTooLarge(req.headers.get("content-length"), BODY_CAP)) {
    return auditFail(ev, "Payload too large", 413);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return auditFail(ev, "Bad JSON", 400);
  }
  // Post-parse ceiling: Content-Length can be omitted/chunked — measure reality.
  if (JSON.stringify(body)?.length > BODY_CAP * 2) {
    return auditFail(ev, "Payload too large", 413);
  }
  const { table, row } = body as { table?: unknown; row?: unknown };
  if (typeof table !== "string" || !(SAVE_TABLES as readonly string[]).includes(table)) {
    return auditFail(ev, "Unknown table", 400);
  }
  // Server-side gate: allowlist + types + lengths + URL whitelist.
  // Client zod is bypassable — THIS is what actually protects the DB.
  const res = sanitizeRow(table, row);
  if (!res.ok || !res.clean) {
    return auditFail(ev, res.error ?? "Bad row", 400);
  }

  try {
    // Resilient: unknown (not-yet-migrated) columns are dropped + retried
    // instead of 500ing the whole save — see _db.ts.
    const saved = await upsertResilient(table, res.clean);
    if (!saved.ok) {
      return auditFail(ev, "Database error", 500);
    }
    if (saved.dropped.length > 0) {
      try {
        revalidatePath("/");
      } catch {
        /* static route — ignore */
      }
      ev.meta = { table, droppedColumns: saved.dropped };
      void audit(ev);
      return NextResponse.json(
        { ok: true, revalidated: true, at: Date.now(), droppedColumns: saved.dropped },
      );
    }
  } catch (e) {
    console.error(`[admin/save] unreachable (${table}):`, e instanceof Error ? e.message : e);
    return auditFail(ev, "Database unreachable", 500);
  }
  try {
    revalidatePath("/");
  } catch {
    /* static route — ignore */
  }
  ev.meta = { table };
  void audit(ev);
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now() });
}
