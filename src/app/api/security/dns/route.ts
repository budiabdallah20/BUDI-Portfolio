import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { checkEmailAuth } from "@/lib/security/dns";

/**
 * SPF / DMARC live check for the /security certificate page.
 *
 * The domain comes from the query string, is strictly validated, and is
 * only ever used as a NAME inside an allowlisted DNS-over-HTTPS query —
 * it can never become a request target (SSRF guard, lib/security/outbound).
 * Rate-limited per IP; result cached briefly so a refresh loop is cheap.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const rl = rateLimit(`security-dns:${clientIp(req)}`, RATE_LIMITS.securityDns.max, RATE_LIMITS.securityDns.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const domain = new URL(req.url).searchParams.get("domain")?.trim() ?? "";
  if (domain === "" || domain.length > 253) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  try {
    const report = await checkEmailAuth(domain);
    return NextResponse.json(
      { ok: true, ...report },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    const invalid = message === "Invalid domain name";
    return NextResponse.json(
      { error: invalid ? "Invalid domain name" : "DNS lookup unavailable — try again" },
      { status: invalid ? 400 : 502 },
    );
  }
}
