/**
 * Rate-limit registry — EVERY budget the public API enforces, in one place.
 *
 * The route handlers import these constants (the numbers can never drift),
 * and `/api/security/status` serves the same registry to the /security
 * certificate page, so the page displays the deployed policy, not a claim.
 *
 * All buckets are per-IP (x-forwarded-for tail, which is proxy-appended
 * behind Vercel — see lib/rate-limit.ts for the honest limits of that)
 * unless the note says otherwise.
 */

export interface LimitSpec {
  max: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  /** Freshness fingerprint polled by open tabs. */
  contentHash: { max: 120, windowMs: 60_000 },
  /** Anonymous visit counter. */
  visit: { max: 10, windowMs: 60_000 },
  /** Like button: burst + sustained budgets. */
  likeBurst: { max: 3, windowMs: 3_000 },
  likeMinute: { max: 30, windowMs: 60_000 },
  /** Admin brute-force: fails across ALL IPs share this bucket. */
  adminGlobal: { max: 40, windowMs: 60_000 },
  /** Deploy diagnostics endpoint. */
  diagnose: { max: 30, windowMs: 60_000 },
  /** /security certificate self-check. */
  securityStatus: { max: 60, windowMs: 60_000 },
  /** SPF/DMARC DNS lookups (external DoH call behind the guard). */
  securityDns: { max: 20, windowMs: 60_000 },
  /** Footer admin entry gate (its own secret). */
  adminEntry: { max: 10, windowMs: 15 * 60_000 },
  /** Deploy punch: per IP + a shared lane across all IPs. */
  deploy: { max: 5, windowMs: 60 * 60_000 },
  deployGlobal: { max: 10, windowMs: 60 * 60_000 },
  /** Client-side error beacon. */
  notifyError: { max: 5, windowMs: 60_000 },
} as const satisfies Record<string, LimitSpec>;

/**
 * Admin gate lockout — the non-bucket half of the brute-force shield
 * (impl in api/admin/_guard.ts; numbers mirrored here for the certificate).
 */
export const ADMIN_LOCKOUT = {
  maxTries: 8,
  lockMs: 15 * 60 * 1000,
  repeatLockMs: 60 * 60 * 1000,
} as const;

/** One row per enforcement point — shipped verbatim to the certificate page. */
export interface RateLimitFact {
  route: string;
  max: number;
  windowMs: number;
  note: string;
}

export const RATE_LIMIT_FACTS: readonly RateLimitFact[] = [
  {
    route: "/api/engagement/visit",
    ...RATE_LIMITS.visit,
    note: "POST visits per IP",
  },
  {
    route: "/api/engagement/like",
    ...RATE_LIMITS.likeMinute,
    note: `plus a ${RATE_LIMITS.likeBurst.max}-hit burst per IP`,
  },
  {
    route: "/api/content-hash",
    ...RATE_LIMITS.contentHash,
    note: "GET polls per IP",
  },
  {
    route: "/api/security/dns",
    ...RATE_LIMITS.securityDns,
    note: "GET lookups per IP",
  },
  {
    route: "/api/security/status",
    ...RATE_LIMITS.securityStatus,
    note: "GET self-checks per IP",
  },
  {
    route: "/api/admin/* (bad secret only)",
    ...RATE_LIMITS.adminGlobal,
    note: `shared across IPs; ${ADMIN_LOCKOUT.maxTries} wrong tries lock an IP for ${ADMIN_LOCKOUT.lockMs / 60_000} min (repeat: ${ADMIN_LOCKOUT.repeatLockMs / 3_600_000} h)`,
  },
  {
    route: "/api/admin/diagnose",
    ...RATE_LIMITS.diagnose,
    note: "global hits per minute",
  },
  {
    route: "/api/admin/entry",
    ...RATE_LIMITS.adminEntry,
    note: "footer entry gate, per IP",
  },
  {
    route: "/api/admin/deploy",
    ...RATE_LIMITS.deploy,
    note: `per IP, plus a shared ${RATE_LIMITS.deployGlobal.max}/h lane across all IPs`,
  },
  {
    route: "/api/notify/error",
    ...RATE_LIMITS.notifyError,
    note: "error beacon per IP (stored max 1 per 10 min globally)",
  },
];
