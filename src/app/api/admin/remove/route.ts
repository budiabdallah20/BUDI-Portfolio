import { NextResponse } from "next/server";
import { checkAdmin } from "../_guard";
import { purgeContentCache } from "../_revalidate";
import { supabaseService } from "@/lib/supabase/server";
import { audit, auditEventFromReq } from "@/lib/audit";

const TABLES = ["services", "skills", "projects", "certs"] as const;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9\-_:.]{0,119}$/;

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

/** Delete one row — every dashboard delete lands here (service_role). */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  const ev = auditEventFromReq(req, "remove");
  if (!gate.ok) {
    ev.ok = false;
    ev.error = gate.error;
    void audit(ev);
    return gateError(gate);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return auditFail(ev, "Bad JSON", 400);
  }
  const { table, id } = body as { table?: unknown; id?: unknown };
  if (typeof table !== "string" || !(TABLES as readonly string[]).includes(table)) {
    return auditFail(ev, "Unknown table", 400);
  }
  if (typeof id !== "string" || !ID_RE.test(id)) {
    return auditFail(ev, "Bad id", 400);
  }

  try {
    const sb = supabaseService();
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) {
      console.error(`[admin/remove] supabase error on ${table}:`, error.message);
      return auditFail(ev, "Database error", 500);
    }
  } catch (e) {
    console.error(`[admin/remove] unreachable (${table}):`, e instanceof Error ? e.message : e);
    return auditFail(ev, "Database unreachable", 500);
  }
  purgeContentCache();
  ev.table = table;
  ev.id = id;
  void audit(ev);
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now() });
}
