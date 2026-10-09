import { timingSafeEqual } from "node:crypto";

/**
 * Admin gate for /api/admin/* — shared-secret + brute-force shield.
 * - Secret travels in `x-admin-secret` (or JSON body `secret` for /verify).
 * - Comparison is timing-safe; failures are counted per IP.
 * - 8 bad tries → IP locked 15 minutes.
 * NOTE: in-memory map (per server instance). Portfolio-scale appropriate;
 * graduate to Upstash/Vercel KV only if abuse ever appears.
 */

const fails = new Map<string, { n: number; until: number }>();
const MAX_TRIES = 8;
const LOCK_MS = 15 * 60 * 1000;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return "local";
}

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
  fails.set(ip, { n, until: n >= MAX_TRIES ? Date.now() + LOCK_MS : 0 });
}

export function checkAdmin(req: Request, bodySecret?: string): { ok: true } | { ok: false; status: number; error: string } {
  const ip = clientIp(req);
  const wait = lockedInfo(ip);
  if (wait > 0) {
    return { ok: false, status: 429, error: `Too many tries — retry in ${Math.ceil(wait / 60000)} min` };
  }
  const want = (process.env.ADMIN_API_SECRET ?? "").trim();
  if (!want) {
    return { ok: false, status: 500, error: "ADMIN_API_SECRET is not configured — restart the server after filling .env" };
  }
  const got = (req.headers.get("x-admin-secret") ?? bodySecret ?? "").trim();
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
