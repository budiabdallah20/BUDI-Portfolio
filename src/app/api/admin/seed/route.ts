import { NextResponse } from "next/server";
import { checkAdmin } from "../_guard";
import { purgeContentCache } from "../_revalidate";
import { upsertResilient } from "../_db";
import type { AdminDB } from "@/components/admin/store";
import { bodyTooLarge, sanitizeRow } from "../_validate";
import { audit, auditEventFromReq } from "@/lib/audit";

export const maxDuration = 60;

/** Whole-DB push is big by nature (images) — 8MB ceiling still stops abuse. */
const BODY_CAP = 8 * 1024 * 1024;
/** Per-table row ceiling — the dashboard holds dozens, never thousands. */
const MAX_ROWS = 500;

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

/**
 * One-click seed — the dashboard sends its full local DB (the exact live
 * content) and the server upserts every table. Used once to fill empty
 * tables, and later as "restore site defaults". Every row passes the same
 * server-side validation as single saves.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  const ev = auditEventFromReq(req, "seed");
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
  const { db } = body as { db?: unknown };
  if (!db || typeof db !== "object") {
    return auditFail(ev, "Missing db payload", 400);
  }
  const data = db as Partial<AdminDB>;
  if (
    !Array.isArray(data.services) ||
    !Array.isArray(data.skills) ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.certs)
  ) {
    return auditFail(ev, "Incomplete db payload", 400);
  }
  const tables = {
    services: data.services,
    skills: data.skills,
    projects: data.projects,
    certs: data.certs,
  } as const;
  const cleaned: Record<string, Record<string, unknown>[]> = {};
  for (const [table, rows] of Object.entries(tables)) {
    if (rows.length > MAX_ROWS) {
      return auditFail(ev, `Too many ${table} rows (max ${MAX_ROWS})`, 413);
    }
    const out: Record<string, unknown>[] = [];
    for (const row of rows) {
      const r = sanitizeRow(table, row);
      if (!r.ok || !r.clean) {
        return auditFail(ev, `Bad ${table} row: ${r.error ?? "invalid"}`);
      }
      out.push(r.clean);
    }
    cleaned[table] = out;
  }
  // Settings: same allowlist as single saves (stale tabs may send retired keys).
  let settingsClean: Record<string, unknown> | null = null;
  if (data.settings && typeof data.settings === "object") {
    const r = sanitizeRow("settings", { id: "site", ...data.settings });
    if (!r.ok || !r.clean) {
      return auditFail(ev, `Bad settings: ${r.error ?? "invalid"}`);
    }
    settingsClean = r.clean;
  }

  try {
    // Resilient per-table upserts (unknown columns dropped + retried).
    const dropped: string[] = [];
    for (const table of ["services", "skills", "projects", "certs"] as const) {
      const r = await upsertResilient(table, cleaned[table]);
      if (!r.ok) {
        return auditFail(ev, "Seed failed", 500);
      }
      dropped.push(...r.dropped.map((c) => `${table}.${c}`));
    }
    if (settingsClean) {
      const r = await upsertResilient("settings", settingsClean);
      if (!r.ok) {
        return auditFail(ev, "Seed failed", 500);
      }
      dropped.push(...r.dropped.map((c) => `settings.${c}`));
    }
    if (dropped.length > 0) {
      purgeContentCache();
      void audit(ev);
      return NextResponse.json({
        ok: true,
        revalidated: true,
        at: Date.now(),
        droppedColumns: dropped,
        seeded: {
          services: cleaned.services.length,
          skills: cleaned.skills.length,
          projects: cleaned.projects.length,
          certs: cleaned.certs.length,
        },
      });
    }
  } catch (e) {
    console.error("[admin/seed] unreachable:", e instanceof Error ? e.message : e);
    return auditFail(ev, "Database unreachable", 500);
  }
  purgeContentCache();
  void audit(ev);
  return NextResponse.json({
    ok: true,
    revalidated: true,
    at: Date.now(),
    seeded: {
      services: cleaned.services.length,
      skills: cleaned.skills.length,
      projects: cleaned.projects.length,
      certs: cleaned.certs.length,
    },
  });
}
