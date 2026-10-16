import type { NextConfig } from "next";

/**
 * React DEV needs eval() (callstack reconstruction) and refuses to run
 * without 'unsafe-eval' — but production React NEVER uses eval. So the
 * directive is dev-only: strict in prod, functional in dev.
 * (next.config is evaluated with NODE_ENV=development under `next dev`
 * and NODE_ENV=production for build/start.)
 *
 * NOTE: script-src has NO bare `https:` host — every script the site runs
 * is 'self' or inline boot code. Any third-party <script> added later must
 * be allowlisted by exact host here, otherwise the browser blocks it.
 */
const SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV !== "production" ? ["'unsafe-eval'"] : []),
].join(" ");

/**
 * Lockdown headers for every document/page (assets under /_next/ inherit
 * them too — harmless). Notes:
 * - `script/style 'unsafe-inline'` is deliberate: the boot/failsafe inline
 *   scripts in layout.tsx + Tailwind/Motion runtime styles REQUIRE it.
 *   Everything else (objects, frames, base) is locked down.
 * - `frame-ancestors 'self'` (not DENY): the dashboard previews the live
 *   site in an <iframe> on the same origin — DENY would break it.
 * - HSTS is ignored on http://localhost by spec, so local dev is unaffected.
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${SCRIPT_SRC}`,
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
  // Same-origin popups stay usable (WhatsApp/Call links use noopener);
  // cross-origin windows can no longer reach back into this page.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // No Flash-era cross-domain socket policy, ever.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Every `quality={...}` used in the codebase must be listed here,
    // otherwise next/image logs "unconfigured qualities" in the console.
    qualities: [75, 90],
  },
  async headers() {
    return [
      // HTML documents must revalidate so a new deploy never serves a stale
      // page referencing deleted hashed chunks (the "stuck loading screen"
      // until Ctrl+F5). Hashed assets under /_next/ stay immutable.
      {
        source: "/:path((?!_next/|images/|fonts/).*)",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      // Lockdown headers on everything (documents + assets).
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
