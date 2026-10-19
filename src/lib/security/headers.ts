/**
 * Single source of truth for the HTTP security headers.
 *
 * WHY THIS FILE EXISTS: the headers used to live inline in `next.config.ts`,
 * so nothing outside the config could prove what the server actually sends.
 * Now `next.config.ts` (build), `/api/security/status` (runtime) and the
 * `/security` certificate page all read the SAME values — the certificate
 * can never drift from reality.
 *
 * RULES:
 * - Keep it dependency-free: it is evaluated by the Next config loader at
 *   build time AND bundled into client code.
 * - Change a header HERE; the config, the API and the certificate all move.
 *
 * Header notes (carried over from the old inline config):
 * - `script/style 'unsafe-inline'` is deliberate: the boot/failsafe inline
 *   scripts in layout.tsx + Tailwind/Motion runtime styles REQUIRE it.
 *   Everything else (objects, frames, base) is locked down.
 * - `frame-ancestors 'self'` (not DENY): the dashboard previews the live
 *   site in an <iframe> on the same origin — DENY would break it.
 * - HSTS/COOP are HTTPS-only by spec; passing `secure: false` (plain-http
 *   dev) drops them so Chromium doesn't log "ignored, untrustworthy origin".
 */

/** 2 years + subdomains + preload eligibility (>= 1 year required). */
export const HSTS_VALUE = "max-age=63072000; includeSubDomains; preload";

/** Header names the certificate page reads back from the live response. */
export const SECURITY_HEADER_NAMES = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "x-permitted-cross-domain-policies",
] as const;

export interface HeaderSpec {
  key: string;
  value: string;
}

/**
 * React DEV needs eval() (callstack reconstruction) and refuses to run
 * without 'unsafe-eval' — but production React NEVER uses eval. So the
 * directive is dev-only: strict in prod, functional in dev.
 *
 * NOTE: script-src has NO bare `https:` host — every script the site runs
 * is 'self' or inline boot code. Any third-party <script> added later must
 * be allowlisted by exact host here, otherwise the browser blocks it.
 */
function scriptSrc(dev: boolean): string {
  return ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])].join(" ");
}

export function buildSecurityHeaders(opts: { dev: boolean; secure: boolean }): HeaderSpec[] {
  return [
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        `script-src ${scriptSrc(opts.dev)}`,
        "style-src 'self' 'unsafe-inline' https:",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join("; "),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    // No Flash-era cross-domain socket policy, ever.
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ...(opts.secure
      ? [
          // HTTPS-only by spec — on plain http they are ignored, and Chromium
          // logs a warning for every LAN preview. Dev drops them, prod keeps
          // full lockdown. Local HTTPS dev (FORCE_HTTPS=1) keeps them too.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: HSTS_VALUE },
        ]
      : []),
  ];
}
