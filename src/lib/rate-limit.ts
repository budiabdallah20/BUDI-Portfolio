/**
 * Tiny in-memory fixed-window rate limiter (portfolio scale).
 *
 * - Keyed by caller (IP, IP+action…). `max` hits per `windowMs`, then 429.
 * - Per server instance by design — Vercel ФИО background. If abuse ever
 *   appears, graduate this exact interface to Upstash/Vercel KV.
 * - Buckets self-clean on a 5-minute sweep so the Map never grows forever.
 */

interface Bucket {
  n: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();
let sweptAt = 0;

function sweep(now: number): void {
  if (now - sweptAt < 5 * 60 * 1000) return;
  sweptAt = now;
  for (const [k, b] of buckets) {
    if (now >= b.reset) buckets.delete(k);
  }
  // Hard cap: under sustained cardinality attack, drop the oldest half.
  if (buckets.size > 20000) {
    const keys = buckets.keys();
    for (let i = 0; i < 10000; i += 1) {
      const k = keys.next();
      if (k.done) break;
      buckets.delete(k.value);
    }
  }
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now >= b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return { ok: true };
  }
  if (b.n >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.reset - now) / 1000)) };
  }
  b.n += 1;
  return { ok: true };
}

/**
 * Client IP for rate-limit keys.
 *
 * Behind an APPENDING proxy (Vercel — the supported deploy target) the real
 * client IP is appended to any attacker-supplied `x-forwarded-for` prefix,
 * so the LAST entry is the one the caller cannot forge; `[0]` was trivially
 * bypassable. We take the tail.
 *
 * HONEST LIMIT: on a directly-exposed `next start` (no proxy in front) no
 * header is trustworthy — route handlers cannot see the socket peer. Per-IP
 * budgets are advisory there; the shared global buckets (admin 40/min,
 * deploy 10/h) still bound total pressure.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (parts.length > 0) return parts[parts.length - 1]!.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip");
  if (real && real.trim() !== "") return real.trim().slice(0, 64);
  return "local";
}
