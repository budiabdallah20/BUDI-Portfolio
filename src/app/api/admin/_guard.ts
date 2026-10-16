import { timingSafeEqual } from "node:crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Admin gate for /api/admin/* — shared-secret + brute-force shield.
 * - Secret travels in `x-admin-secret` (or JSON body `secret` for /verify).
 * - Comparison is timing-safe; failures are counted per IP.
 * - 8 bad tries → IP locked 15 minutes (repeat offenders: 1 hour).
 * - A GLOBAL bucket (40 fails/min across all IPs) blunts distributed
 *   guessing even if the attacker rotates source IPs.
 * - IP comes from the TAIL of x-forwarded-for (the entry the platform
 *   appends — attacker prefixes can't spoof it). See lib/rate-limit.
 * NOTE: in-memory (per server instance). Portfolio-scale appropriate;
 * graduate to Upstash/Vercel KV only if abuse ever appears.
 */

const fails = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 8;
const LOCK_MS = 15 * 60 * 1000;
const REPEAT_LOCK_MS = 60 * 60 * 1000;
const GLOBAL_MAX = 40;
const GLOBAL_WINDOW_MS = 60 * 1000;

function lockedInfo(ip: string): number {
  const rec = fails.get(ip);
  if (!rec) return 0;
  if (Date.now() > rec.until && rec.n < MAX_TRIES) {
    fails.delete(ip);
    return 0;
  }
  if (rec.n >= MAX_TRIES && Date.now() < rec.until) return rec.until - Date.now();
  if (rec.n >= MAX_TRIES) fails.delete(ip);
  return 0;
}

function recordFail(ip: string): void {
  const rec = fails.get(ip);
  const n = (rec?.n ?? 0) + 1;
  // Repeat offenders (already locked once) earn the long lock.
  const wasLocked = rec !== undefined && rec.n >= MAX_TRIES;
  fails.set(ip, { n, until: n >= MAX_TRIES ? Date.now() + (wasLocked ? REPEAT_LOCK_MS : LOCK_MS) : 0 });
}

/** Warn once when the gate runs on a missing/degenerate secret. */
let warnedWeak = false;
function warnWeakSecret(want: string): void {
  if (warnedWeak || want.length >= 4) return;
  warnedWeak = true;
  console.warn(
    "[admin-guard] ADMIN_API_SECRET is empty or <4 chars — admin writes are rejected until it is configured.",
  );
}

export function checkAdmin(
  req: Request,
  bodySecret?: string,
): { ok: true } | { ok: false; status: number; error: string; retryAfterSec?: number } {
  const ip = clientIp(req);
  const wait = lockedInfo(ip);
  if (wait > 0) {
    return {
      ok: false,
      status: 429,
      error: `Too many tries — retry in ${Math.ceil(wait / 60000)} min`,
      retryAfterSec: Math.ceil(wait / 1000),
    };
  }
  const global = rateLimit("admin-global", GLOBAL_MAX, GLOBAL_WINDOW_MS);
  if (!global.ok) {
    return {
      ok: false,
      status: 429,
      error: "Too many tries — retry shortly",
      retryAfterSec: global.retryAfterSec,
    };
  }
  const want = (process.env.ADMIN_API_SECRET ?? "").trim();
  if (!want) {
    return {
      ok: false,
      status: 500,
      error:
        "ADMIN_API_SECRET is not configured — add it to .env locally, or to hosting env vars + redeploy on Vercel",
    };
  }
  warnWeakSecret(want);
  const got = (req.headers.get("x-admin-secret") ?? bodySecret ?? "").trim();
  // Cap compared length: a megabyte-long guess is a DoS probe, not a PIN.
  if (got.length > 256) {
    recordFail(ip);
    return { ok: false, status: 401, error: "Wrong secret" };
  }
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  const match = a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
  if (!match) {
    recordFail(ip);
    return { ok: false, status: 401, error: "Wrong secret" };
  }
  fails.delete(ip);
  return { ok: true };
}
