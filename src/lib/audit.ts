/**
 * Append-only administrative audit log.
 *
 * Checklist item: "تسجيل جميع العمليات الإدارية وتغييرات الصلاحيات في
 * Audit Logs غير قابلة للتعديل (Append-Only)."
 *
 * Design:
 * - Every event is emitted as one JSON line to console.log → captured and
 *   retained by the hosting platform (Vercel function logs). Platform logs
 *   are append-only by nature.
 * - In dev (or when AUDIT_LOG=1), the same line is appended to audit.log —
 *   pure append, never rewritten or deleted.
 * - Never throws: audit must never break a request or leak secrets.
 * - Never logs the admin secret, passwords, or PII (action + table + id +
 *   IP only).
 */

import { clientIp } from "@/lib/rate-limit";

export interface AuditEvent {
  action: "save" | "remove" | "seed" | "verify" | string;
  table?: string;
  id?: string;
  ip: string;
  ua?: string;
  ok: boolean;
  error?: string;
  at?: number;
  meta?: Record<string, unknown>;
}

const LOG_PATH = process.env.AUDIT_LOG_PATH ?? "audit.log";
let fsMod: typeof import("node:fs") | null = null;
let fsTried = false;

function getFs(): typeof import("node:fs") | null {
  if (fsTried) return fsMod;
  fsTried = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fsMod = (require as unknown as (id: string) => unknown)(
      "node:fs",
    ) as typeof import("node:fs");
  } catch {
    /* ESM runtime without require — file logging disabled, console only */
    fsMod = null;
  }
  return fsMod;
}

/** Should we also write the local append-only file (dev / opt-in). */
function fileLoggingEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.AUDIT_LOG === "1";
}

/**
 * Record one admin event. Fire-and-forget safe: `void audit(...)`.
 * The console line is synchronous; the file append is best-effort async.
 */
export function audit(event: AuditEvent): void {
  const line = JSON.stringify({
    level: "audit",
    at: event.at ?? Date.now(),
    action: event.action,
    table: event.table ?? null,
    id: event.id ?? null,
    ip: event.ip,
    ua: event.ua ?? null,
    ok: event.ok,
    error: event.error ?? null,
    meta: event.meta ?? null,
  });
  // Platform capture (Vercel logs) — append-only, always on.
  try {
    console.log(line);
  } catch {
    /* noop */
  }
  // Local append-only file — dev / opt-in only, never edits history.
  if (!fileLoggingEnabled()) return;
  const fs = getFs();
  if (!fs) return;
  try {
    fs.appendFileSync(LOG_PATH, line + "\n", { encoding: "utf8" });
  } catch {
    /* noop — audit must never break the request */
  }
}

/** Build a minimal AuditEvent from an incoming Request. */
export function auditEventFromReq(
  req: Request,
  action: string,
  opts: { table?: string; id?: string; ua?: string; meta?: Record<string, unknown> } = {},
): AuditEvent {
  return {
    action,
    table: opts.table,
    id: opts.id,
    ip: clientIp(req),
    ua: opts.ua ?? req.headers.get("user-agent") ?? undefined,
    ok: true,
    meta: opts.meta,
  };
}
