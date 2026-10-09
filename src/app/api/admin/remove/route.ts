import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";
import { supabaseService } from "@/lib/supabase/server";

const TABLES = ["services", "skills", "projects", "certs"] as const;

/** Delete one row — every dashboard delete lands here (service_role). */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { table, id } = body as { table?: unknown; id?: unknown };
  if (typeof table !== "string" || !(TABLES as readonly string[]).includes(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }
  if (typeof id !== "string" || id.length === 0 || id.length > 120) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  try {
    const sb = supabaseService();
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now() });
}
