import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Rate-limited visit counter — the ONLY path to the counter. The
 * `increment_visit` RPC is REVOKED for anon/authenticated (see schema.sql),
 * so bots can't inflate stats or burn the Supabase quota with direct calls.
 * One increment per tab session is enforced client-side (sessionStorage);
 * THIS route enforces the server side: max 10 visit-hits/min per IP.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const ip = clientIp(req);
  const rl = rateLimit(`visit:${ip}`, 10, 60 * 1000);
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
