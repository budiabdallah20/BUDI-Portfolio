import { NextResponse, type NextRequest } from "next/server";

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

function isPrivateLan(hostname: string): boolean {
  if (hostname.startsWith("192.168.")) return true;
  if (hostname.startsWith("10.")) return true;
  const m172 = /^172\.(1[6-9]|2\d|3[01])\./.exec(hostname);
  return m172 !== null;
}

/**
 * Force HTTPS across the WHOLE domain — live site AND /admin dashboard.
 *
 * On Vercel the platform already terminates TLS and upgrades http→https,
 * so this proxy is a no-op in production there (x-forwarded-proto is already
 * "https:"). It matters if the app is ever self-hosted or moved to a host
 * that doesn't auto-redirect, and it keeps the redirect logic in version
 * control instead of relying on platform-specific config.
 *
 * 308 (Permanent Redirect) preserves the request method and body, so a POST
 * to http://.../api/admin/save lands on https://.../api/admin/save instead of
 * degrading to a GET. HSTS header (next.config.ts) then tells browsers to
 * upgrade automatically on future visits.
 *
 * Local dev is NEVER redirected: localhost / 127.0.0.1 / ::1 / *.local /
 * private LAN have no TLS cert, so redirecting would break `next dev`
 * (and phone-on-LAN testing) with a dead https://localhost:3000.
 */
export function proxy(req: NextRequest): NextResponse {
  // CSRF / cross-origin guard for state-changing API calls: browsers always
  // send an Origin header on cross-site requests, so a mismatched (or
  // obviously foreign) Origin on a mutating method is rejected. Same-origin
  // and server-to-server (no Origin) calls pass through untouched.
  const method = req.method.toUpperCase();
  if (
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") &&
    req.nextUrl.pathname.startsWith("/api/")
  ) {
    const origin = req.headers.get("origin");
    if (origin) {
      let ok = false;
      try {
        const o = new URL(origin);
        ok = o.host === req.nextUrl.host;
      } catch {
        ok = false;
      }
      if (!ok) {
        return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      }
    }
  }

  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto === "https") return NextResponse.next();

  const { protocol, hostname } = req.nextUrl;
  if (protocol !== "http:") return NextResponse.next();
  if (isLoopback(hostname) || isPrivateLan(hostname)) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    /*
     * Match everything except Next.js internals and static public files, so
     * assets / image optimization keep working on either scheme.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
