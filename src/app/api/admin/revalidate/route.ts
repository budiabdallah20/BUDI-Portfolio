import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";

/**
 * REAL hard refresh — purges the ISR cache for the live site (`/`) and the
 * content API (`/api/content`), so the very next paint is rebuilt from
 * Supabase instead of served stale. Called by the dashboard "Hard" preview
 * buttons and the Home tab "Refresh site now" command. Every cloud write
 * (save / remove / seed) already revalidates server-side too — this route
 * is the explicit, provable trigger with a timestamp the UI can show.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const paths: string[] = [];
  try {
    revalidatePath("/");
    paths.push("/");
  } catch {
    /* static export — nothing to purge */
  }
  try {
    revalidatePath("/api/content");
    paths.push("/api/content");
  } catch {
    /* static export — nothing to purge */
  }
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now(), paths });
}
