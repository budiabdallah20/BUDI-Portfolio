import os from "node:os";
import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security/headers";

const IS_DEV = process.env.NODE_ENV !== "production";
// Local HTTPS dev (`npm run dev:https`) is a secure context even though
// NODE_ENV is "development" — treat it like prod for HSTS/COOP so the
// encrypted server ships the full lockdown header set instead of dropping it.
const IS_SECURE = process.env.NODE_ENV === "production" || process.env.FORCE_HTTPS === "1";

/**
 * Dev-only: Next blocks dev-only endpoints (`__nextjs_font/...`, the HMR
 * socket, dev assets) for any origin it wasn't started with. Opening the
 * "Network:" URL that `next dev` prints (e.g. http://192.168.1.8:3000 from a
 * phone or a second device) therefore used to fail with 403 on the font
 * proxy and `net::ERR_INVALID_HTTP_RESPONSE` on the HMR socket.
 *
 * Only exact addresses this machine actually has are trusted (plus
 * `*.localhost`/`*.local`). Blanket wildcards like `192.168.*.*` were
 * removed: they also match attacker-owned FQDNs such as
 * `192.168.evil.com`, widening dev-mode trust for no benefit.
 */
function lanDevOrigins(): string[] {
  const hosts = new Set<string>(["*.localhost", "*.local"]);
  try {
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses ?? []) {
        if (address.family === "IPv4" && !address.internal) hosts.add(address.address);
      }
    }
  } catch {
    /* os unavailable — *.localhost still covers same-machine dev */
  }
  return [...hosts];
}

/**
 * Security headers (CSP, HSTS, XFO, …) are defined ONCE in
 * `src/lib/security/headers.ts` — the same module the /security certificate
 * page reads, so what the browser receives and what the page displays can
 * never drift. See that file for the per-directive rationale.
 */
const SECURITY_HEADERS = buildSecurityHeaders({ dev: IS_DEV, secure: IS_SECURE });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Dev-only allow-list: the LAN/Wi-Fi hosts `next dev` advertises. Without
  // it the font proxy 403s and the HMR socket dies for every non-localhost
  // visitor. Production ignores this option entirely.
  allowedDevOrigins: IS_DEV ? lanDevOrigins() : [],
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
