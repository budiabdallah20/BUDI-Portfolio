import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Tiny freshness fingerprint — max updated_at + row counts + likes sum,
 * no payload. RealtimeRefresh polls this every few seconds as a fallback
 * (when the realtime publication was never enabled), so dashboard edits
 * still land on open tabs within seconds without ever downloading content.
 *
 * Abuse-proof by design: per-IP rate limit, generic errors (never raw DB
 * messages), ~100-byte JSON. Hammering it buys an attacker nothing.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const rl = rateLimit(`content-hash:${clientIp(req)}`, 120, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  try {
    const sb = supabaseAnon();
    const [services, skills, projects, certs, settings, likes] = await Promise.all([
      sb.from("services").select("updated_at"),
      sb.from("skills").select("updated_at"),
      sb.from("projects").select("updated_at"),
      sb.from("certs").select("updated_at"),
      sb.from("settings").select("updated_at"),
      // likes has no updated_at — the COUNT SUM is its fingerprint.
      sb.from("likes").select("count"),
    ]);
    const failed = [services, skills, projects, certs, settings, likes].some((r) => r.error);
    if (failed) {
      console.error("[api/content-hash] supabase error");
      return NextResponse.json({ error: "Content unavailable" }, { status: 500 });
    }
    const stamp = (rows: { updated_at?: string }[] | null): string =>
      (rows ?? []).reduce(
        (max, r) => (r.updated_at && r.updated_at > max ? r.updated_at : max),
        "",
      );
    const counts = {
      services: services.data?.length ?? 0,
      skills: skills.data?.length ?? 0,
      projects: projects.data?.length ?? 0,
      certs: certs.data?.length ?? 0,
    };
    const likesSum = ((likes.data ?? []) as { count?: number }[]).reduce(
      (n, r) => n + (r.count ?? 0),
      0,
    );
    const at = [
      stamp(services.data),
      stamp(skills.data),
      stamp(projects.data),
      stamp(certs.data),
      stamp(settings.data),
    ].reduce((max, s) => (s > max ? s : max), "");
    return NextResponse.json({ at, counts, likes: likesSum });
  } catch (e) {
    console.error("[api/content-hash] unreachable:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Content unavailable" }, { status: 500 });
  }
}
