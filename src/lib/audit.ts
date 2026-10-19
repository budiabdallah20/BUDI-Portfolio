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

import { appendFileSync } from "node:fs";
import path from "node:path";
import { clientIp } from "@/lib/rate-limit";
import { resolveInside } from "@/lib/security/safe-path";

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

/**
 * Resolve the log target through the traversal guard: a relative name stays
 * inside the project root; an absolute path only when it came from the
 * operator's env (trusted config, never user input).
 */
function logTarget(): string | null {
  if (path.isAbsolute(LOG_PATH)) return LOG_PATH;
  return resolveInside(process.cwd(), LOG_PATH);
}

/** Should we also write the local append-only file (dev / opt-in). */
function fileLoggingEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.AUDIT_LOG === "1";
}

/**
 * Record one admin event. Fire-and-forget safe: `void audit(...)`.
 * The console line is synchronous; the file append is best-effort.
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
  const target = logTarget();
  if (!target) return;
  try {
    appendFileSync(target, line + "\n", { encoding: "utf8" });
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
