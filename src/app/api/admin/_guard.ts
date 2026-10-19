import { timingSafeEqual } from "node:crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ADMIN_LOCKOUT, RATE_LIMITS } from "@/lib/security/limits";

/**
 * Admin gate for /api/admin/* — shared-secret + brute-force shield.
 * - Secret travels in `x-admin-secret` (or JSON body `secret` for /verify).
 * - Comparison is timing-safe; failures are counted per IP.
 * - 8 bad tries → IP locked 15 minutes.
 * - REPEAT offenders (a second lock on the same IP) get 1 hour instead —
 *   `strikes` is what remembers that across the expiry, see below.
 * - A GLOBAL bucket (40 fails/min across all IPs) blunts distributed
 *   guessing even if the attacker rotates source IPs.
 * - IP comes from the TAIL of x-forwarded-for (the entry the platform
 *   appends — attacker prefixes can't spoof it). See lib/rate-limit.
 * NOTE: in-memory (per server instance). Portfolio-scale appropriate;
 * graduate to Upstash/Vercel KV only if abuse ever appears.
 */

interface FailRec {
  /** Wrong guesses in the CURRENT lock window. Reset when the window ends. */
  n: number;
  /** Epoch ms the current lock expires (0 = not locked). */
  until: number;
  /** How many times this IP has EVER been locked. Never reset by expiry. */
  strikes: number;
}

const fails = new Map<string, FailRec>();
// Numbers live in lib/security/limits.ts so the /security certificate
// displays the SAME policy this gate enforces.
const MAX_TRIES = ADMIN_LOCKOUT.maxTries;
const LOCK_MS = ADMIN_LOCKOUT.lockMs;
const REPEAT_LOCK_MS = ADMIN_LOCKOUT.repeatLockMs;
const GLOBAL_MAX = RATE_LIMITS.adminGlobal.max;
const GLOBAL_WINDOW_MS = RATE_LIMITS.adminGlobal.windowMs;
/** Hard cap so IP-rotation can't grow the Map forever (see lib/rate-limit). */
const MAX_TRACKED_IPS = 20_000;

/**
 * Remaining lock for this IP, and expire stale windows.
 *
 * BUG FIXED HERE: this used to `fails.delete(ip)` the moment a lock elapsed,
 * which destroyed the only record that the IP had been locked before — so
 * `recordFail`'s repeat-offender check could NEVER be true and the 1-hour
 * REPEAT_LOCK_MS was unreachable dead code. An attacker simply waited out
 * the 15-minute lock and got a pristine 8 guesses, forever (≈768 guesses/day
 * against a 4-digit PIN). Now the window resets but `strikes` survives, so
 * the escalation to 1 hour actually happens on the second lock.
 */
function lockedInfo(ip: string): number {
  const rec = fails.get(ip);
  if (!rec) return 0;
  // Still inside its guess window — NOT locked. Must return without touching
  // `n`, or every request would zero the counter and the tries would never
  // accumulate toward MAX_TRIES.
  if (rec.n < MAX_TRIES) return 0;
  if (Date.now() < rec.until) return rec.until - Date.now();
  // Lock served — reset the tries but KEEP `strikes` so the next lock
  // escalates to REPEAT_LOCK_MS.
  rec.n = 0;
  return 0;
}

function recordFail(ip: string): void {
  const rec = fails.get(ip);
  const strikes = rec?.strikes ?? 0;
  const n = (rec?.n ?? 0) + 1;
  if (n < MAX_TRIES) {
    fails.set(ip, { n, until: 0, strikes });
    return;
  }
  // Repeat offenders (strikes > 0 → already served a lock) earn the long one.
  const lockMs = strikes > 0 ? REPEAT_LOCK_MS : LOCK_MS;
  fails.set(ip, { n, until: Date.now() + lockMs, strikes: strikes + 1 });
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

/**
 * Swallow the per-IP map so IP-rotation can't grow it without bound.
 * `fails` entries are cheap but there is no TTL sweep of its own.
 */
function sweep(now: number): void {
  if (fails.size <= MAX_TRACKED_IPS) return;
  const it = fails.keys();
  for (let i = 0; i < MAX_TRACKED_IPS / 2; i += 1) {
    const k = it.next();
    if (k.done) break;
    fails.delete(k.value);
  }
}

/**
 * The gate. Order matters:
 *   1. per-IP lock (cheap reject, no crypto)
 *   2. compare the secret (timing-safe)
 *   3. ONLY on a wrong guess, spend the shared global bucket
 *
 * Step 3 is the DoS fix: the bucket used to be charged on EVERY call,
 * including correct ones, which meant (a) "Push EVERYTHING" — hundreds of
 * saves in a burst — could lock the OWNER out with a 429, and (b) an
 * anonymous attacker could burn 40 guesses/min to lock the owner out at
 * will. Now a valid secret is never rate-limited, while a wrong one from
 * any number of IPs still drains the same shared bucket — distributed
 * brute force stays throttled exactly as before.
 */
export function checkAdmin(
  req: Request,
  bodySecret?: string,
): { ok: true } | { ok: false; status: number; error: string; retryAfterSec?: number } {
  const ip = clientIp(req);
  sweep(Date.now());
  const wait = lockedInfo(ip);
  if (wait > 0) {
    return {
      ok: false,
      status: 429,
      error: `Too many tries — retry in ${Math.ceil(wait / 60000)} min`,
      retryAfterSec: Math.ceil(wait / 1000),
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
  const oversize = got.length > 256;
  const a = Buffer.from(oversize ? "" : got);
  const b = Buffer.from(want);
  const match = !oversize && a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
  if (match) {
    fails.delete(ip);
    return { ok: true };
  }

  // Wrong guess — this is the only path that spends the global bucket.
  const global = rateLimit("admin-global", GLOBAL_MAX, GLOBAL_WINDOW_MS);
  recordFail(ip);
  if (!global.ok) {
    return {
      ok: false,
      status: 429,
      error: "Too many tries — retry shortly",
      retryAfterSec: global.retryAfterSec,
    };
  }
  return { ok: false, status: 401, error: "Wrong secret" };
}
