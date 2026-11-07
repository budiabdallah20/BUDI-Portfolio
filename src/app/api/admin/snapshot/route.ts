import { NextResponse } from "next/server";
import { checkAdmin } from "../_guard";
import { supabaseService } from "@/lib/supabase/server";
import { previewRows } from "@/lib/preview-content";

/** Complete dashboard snapshot, including hidden drafts. Never served through the public anon endpoint. */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) {
    const headers = gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined;
    return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
  }
  try {
    const sb = supabaseService();
    const [services, skills, projects, certs, settings, visits, likes] = await Promise.all([
      sb.from("services").select("*").order("title"),
      sb.from("skills").select("*"),
      sb.from("projects").select("*"),
      sb.from("certs").select("*"),
      sb.from("settings").select("*").eq("id", "site").maybeSingle(),
      sb.from("visits").select("count"),
      sb.from("likes").select("id,count"),
    ]);
    if ([services, skills, projects, certs, settings, visits, likes].some((result) => result.error)) {
      console.error("[admin/snapshot] database error");
      return NextResponse.json({ error: "Snapshot unavailable" }, { status: 503 });
    }
    return NextResponse.json({
      services: await previewRows("services", services.data ?? []),
      skills: await previewRows("skills", skills.data ?? []),
      projects: await previewRows("projects", projects.data ?? []),
      certs: await previewRows("certs", certs.data ?? []),
      settings: (await previewRows("settings", settings.data ? [settings.data] : []))[0] ?? null,
      visitsTotal: (visits.data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0),
      likes: Object.fromEntries((likes.data ?? []).map((row) => [row.id, row.count ?? 0])),
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("[admin/snapshot] unavailable:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Snapshot unavailable" }, { status: 503 });
  }
}
