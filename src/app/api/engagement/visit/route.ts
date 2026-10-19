import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";

/** Log the "not configured" warning once per server instance, not per visit. */
let warnedMissingService = false;

/**
 * Rate-limited visit counter — the ONLY path to the counter. The
 * `increment_visit` RPC is REVOKED for anon/authenticated (see schema.sql),
 * so bots can't inflate stats or burn the Supabase quota with direct calls.
 * One increment per tab session is enforced client-side (sessionStorage);
 * THIS route enforces the server side: max 10 visit-hits/min per IP.
 */
export async function POST(req: Request): Promise<NextResponse> {
  // Fire-and-forget analytics. When the service role isn't configured the
  // counter simply does not exist yet — answer 204 (nothing to record)
  // instead of 503. A 5xx here only paints "Failed to load resource" in
  // every visitor's console for a feature that was never switched on; the
  // owner still sees the real reason in the server log. This is checked
  // before the rate limiter: with no counter there is nothing to protect,
  // and 429s would be just as noisy as the 503 it replaces.
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    if (!warnedMissingService) {
      warnedMissingService = true;
      console.warn(
        "[engagement/visit] counter skipped: set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable visit stats",
      );
    }
    return new NextResponse(null, { status: 204 });
  }
  const ip = clientIp(req);
  const rl = rateLimit(`visit:${ip}`, RATE_LIMITS.visit.max, RATE_LIMITS.visit.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many hits" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  let id = "site";
  try {
    const body = (await req.json()) as { id?: unknown };
    if (typeof body.id === "string" && body.id.trim() !== "") id = body.id.trim();
  } catch {
    /* empty body → default id */
  }
  // eslint-disable-next-line no-control-regex
  if (id.length > 120 || /[\u0000-\u001f\u007f<>]/.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  try {
    const sb = supabaseService();
    const res = await sb.rpc("increment_visit", { p_id: id });
    if (res.error) throw res.error;
    // Owner ping — one inbox row + push per 20 min max (no spam).
    void (async (): Promise<void> => {
      try {
        const { recentOfType, insertNotification } = await import("@/lib/notify");
        if (await recentOfType("visit", 20 * 60 * 1000)) return;
        await insertNotification({
          type: "visit",
          title: "👀 زائر جديد في موقعك",
          body: "حد دخل البورتفوليو دلوقتي — بص على الإحصائيات.",
          url: "/admin",
        });
        const { fanoutPush } = await import("@/lib/push");
        await fanoutPush({ title: "👀 زائر جديد في موقعك", body: "حد دخل البورتفوليو دلوقتي.", url: "/admin", tag: "visit" });
      } catch {
        /* auxiliary */
      }
    })();
    return NextResponse.json({ ok: true, count: (res.data as number | null) ?? null });
  } catch (e) {
    console.error("[engagement/visit] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
