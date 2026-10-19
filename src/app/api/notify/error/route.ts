import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { insertNotification, recentOfType } from "@/lib/notify";

/**
 * Public site-error beacon — throttled + validated, inbox-only.
 * 5 hits/min per IP; one stored error per 10 min globally so a broken
 * loop can't flood the owner's phone.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(
    `err-beacon:${ip}`,
    RATE_LIMITS.notifyError.max,
    RATE_LIMITS.notifyError.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many hits" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  let body: { message?: unknown; where?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 200) : "";
  if (message === "") return NextResponse.json({ error: "Empty" }, { status: 400 });
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f<>]/.test(message)) {
    return NextResponse.json({ error: "Bad message" }, { status: 400 });
  }
  const where = typeof body.where === "string" ? body.where.trim().slice(0, 120) : "";
  if (await recentOfType("error", 10 * 60 * 1000)) return NextResponse.json({ ok: true, deduped: true });
  await insertNotification({ type: "error", title: "⚠ Site error", body: `${message}${where ? ` — ${where}` : ""}`, url: "/admin" });
  try {
    const { fanoutPush } = await import("@/lib/push");
    void fanoutPush({ title: "⚠ Site error", body: message, url: "/admin" }).catch(() => undefined);
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
