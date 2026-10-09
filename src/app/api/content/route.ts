import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/server";

/** Public aggregated content — dashboard sync + health checks read this. */
export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  try {
    const sb = supabaseAnon();
    const [services, skills, projects, certs, settings, visits, likes] = await Promise.all([
      sb.from("services").select("*").order("title"),
      sb.from("skills").select("*"),
      sb.from("projects").select("*"),
      sb.from("certs").select("*"),
      sb.from("settings").select("*").eq("id", "site").maybeSingle(),
      sb.from("visits").select("count"),
      sb.from("likes").select("id,count"),
    ]);
    const firstError = [services, skills, projects, certs, settings, visits, likes].find(
      (r) => r.error,
    )?.error;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }
    return NextResponse.json({
      services: services.data ?? [],
      skills: skills.data ?? [],
      projects: projects.data ?? [],
      certs: certs.data ?? [],
      settings: settings.data ?? null,
      visitsTotal: (visits.data ?? []).reduce((n, r) => n + (r.count ?? 0), 0),
      likes: Object.fromEntries((likes.data ?? []).map((r) => [r.id, r.count ?? 0])),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database unreachable" },
      { status: 500 },
    );
  }
}
