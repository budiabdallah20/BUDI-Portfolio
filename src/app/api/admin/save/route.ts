import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";
import { supabaseService } from "@/lib/supabase/server";

const TABLES = ["services", "skills", "projects", "certs", "settings"] as const;

/** Settings allowlist — stale dashboard tabs may still send retired v2
 *  boolean keys; strip them so the upsert never hits missing columns. */
const SETTINGS_COLUMNS = [
  "id",
  "siteName",
  "tagline",
  "maintenance",
  "showLoader",
  "likesEnabled",
  "contactEmail",
  "heroImage",
  "aboutImage",
  "workStatus",
  "workNote",
  "workNoteFr",
  "workUntil",
  "vodafoneState",
  "vodafoneNumber",
  "vodafoneAt",
  "taptapState",
  "taptapAt",
  "instapayState",
  "instapayHandle",
  "instapayAt",
  "siteVerified",
  "verificationBadges",
] as const;

/** Upsert one row — every dashboard create/edit lands here (service_role). */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const { table, row } = body as { table?: unknown; row?: unknown };
  if (typeof table !== "string" || !(TABLES as readonly string[]).includes(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return NextResponse.json({ error: "Bad row" }, { status: 400 });
  }
  const clean = { ...(row as Record<string, unknown>) };
  if (table === "settings") {
    for (const key of Object.keys(clean)) {
      if (!(SETTINGS_COLUMNS as readonly string[]).includes(key)) delete clean[key];
    }
  }
  if (typeof clean.id !== "string" || clean.id.length === 0 || clean.id.length > 120) {
    return NextResponse.json({ error: "Row needs a valid id" }, { status: 400 });
  }

  try {
    const sb = supabaseService();
    const { error } = await sb.from(table).upsert(clean, { onConflict: "id" });
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
    /* static route — ignore */
  }
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now() });
}
