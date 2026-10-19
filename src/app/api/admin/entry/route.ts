import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";

/**
 * Separate entry gate for the footer "admin" button.
 * Uses its OWN secret (ADMIN_ENTRY_PASSWORD) — deliberately different from
 * ADMIN_API_SECRET so the two locks never share a credential.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(
    `admin-entry:${ip}`,
    RATE_LIMITS.adminEntry.max,
    RATE_LIMITS.adminEntry.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many tries — retry later" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const want = (process.env.ADMIN_ENTRY_PASSWORD ?? "").trim();
  if (!want) {
    return NextResponse.json(
      { error: "ADMIN_ENTRY_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (password.length > 256) password = password.slice(0, 256);

  const a = Buffer.from(password);
  const b = Buffer.from(want);
  const ok = a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
