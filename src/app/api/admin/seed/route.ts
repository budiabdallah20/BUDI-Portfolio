import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";
import { supabaseService } from "@/lib/supabase/server";
import type { AdminDB } from "@/components/admin/store";

/**
 * One-click seed — the dashboard sends its full local DB (the exact live
 * content) and the server upserts every table. Used once to fill empty
 * tables, and later as "restore site defaults".
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { db } = body as { db?: unknown };
  if (!db || typeof db !== "object") {
    return NextResponse.json({ error: "Missing db payload" }, { status: 400 });
  }
  const data = db as Partial<AdminDB>;
  if (
    !Array.isArray(data.services) ||
    !Array.isArray(data.skills) ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.certs)
  ) {
    return NextResponse.json({ error: "Incomplete db payload" }, { status: 400 });
  }

  try {
    const sb = supabaseService();
    const jobs: Array<PromiseLike<{ error: unknown }>> = [
      sb.from("services").upsert(data.services, { onConflict: "id" }),
      sb.from("skills").upsert(data.skills, { onConflict: "id" }),
      sb.from("projects").upsert(data.projects, { onConflict: "id" }),
      sb.from("certs").upsert(data.certs, { onConflict: "id" }),
    ];
    if (data.settings && typeof data.settings === "object") {
      jobs.push(
        sb.from("settings").upsert({ id: "site", ...data.settings }, { onConflict: "id" }),
      );
    }
    const results = await Promise.all(jobs);
    for (const r of results) {
      if (r.error) {
        const msg = typeof r.error === "object" && r.error !== null && "message" in r.error
          ? String((r.error as { message: unknown }).message)
          : "Seed failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database unreachable" },
      { status: 500 },
    );
  }
  try {
    revalidatePath("/");
  } catch {
    /* ignore */
  }
  return NextResponse.json({
    ok: true,
    revalidated: true,
    at: Date.now(),
    seeded: {
      services: data.services.length,
      skills: (data.skills as unknown[]).length,
      projects: (data.projects as unknown[]).length,
      certs: (data.certs as unknown[]).length,
    },
  });
}
