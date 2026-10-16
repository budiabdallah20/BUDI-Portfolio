import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Rate-limited like/unlike proxy — the ONLY path to the counters.
 * The RPCs are REVOKED for anon/authenticated (see schema.sql): the public
 * anon key can SELECT counts but can never increment. Every vote funnels
 * through HERE (service_role + per-IP limits), so direct-RPC spam, count
 * races and like-id table bloat are structurally impossible.
 *
 * Limits (per IP): 30 votes/min, 3/sec burst. The heart UI stays optimistic
 * and offline-capable — a 429 just means "slow down", the local heart wins.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f<>]/;
const SCHEME_RE = /^(javascript|data|vbscript|file|blob):/i;

function validKey(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (s.length < 1 || s.length > 200) return false;
  if (CONTROL_RE.test(s) || SCHEME_RE.test(s)) return false;
  return true;
}

export async function POST(req: Request): Promise<NextResponse> {
  const ip = clientIp(req);
  const burst = rateLimit(`like-burst:${ip}`, 3, 3 * 1000);
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(burst.retryAfterSec) } },
    );
  }
  const minute = rateLimit(`like:${ip}`, 30, 60 * 1000);
  if (!minute.ok) {
    return NextResponse.json(
      { error: "Too many votes — try again shortly" },
      { status: 429, headers: { "Retry-After": String(minute.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { key, action } = body as { key?: unknown; action?: unknown };
  if (!validKey(key)) return NextResponse.json({ error: "Bad key" }, { status: 400 });
  if (action !== "like" && action !== "unlike") {
    return NextResponse.json({ error: "Bad action" }, { status: 400 });
  }

  try {
    const sb = supabaseService();
    const rpc = action === "like" ? "increment_like" : "decrement_like";
    const res = await sb.rpc(rpc, { p_id: key });
    if (res.error) throw res.error;
    return NextResponse.json({ ok: true, count: (res.data as number | null) ?? null });
  } catch (e) {
    // Offline/DB hiccup: the caller's local heart is the fallback.
    console.error("[engagement/like] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
