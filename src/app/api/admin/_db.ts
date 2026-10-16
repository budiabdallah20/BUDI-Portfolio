import { supabaseService } from "@/lib/supabase/server";

/**
 * Self-healing upsert — the schema-drift airbag.
 *
 * The dashboard ships features (new columns) faster than the cloud schema
 * gets re-run: a row carrying a column Postgres doesn't know yet fails the
 * whole write with 42703 ("column does not exist") → the dreaded 500
 * "Database error" on a simple work-status toggle. Instead of failing, we
 * drop the unknown column(s) and retry (max 3 drops, never `id`), so the
 * write lands TODAY. A server warning tells the owner to re-run
 * supabase/schema.sql — the permanent fix — while users feel nothing.
 */

const MISSING_COLUMN_RE = /column "([^"]+)" of relation "[^"]+" does not exist|column ([\w.]+) does not exist/i;

export type UpsertOutcome =
  | { ok: true; dropped: string[] }
  | { ok: false; message: string };

export async function upsertResilient(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
): Promise<UpsertOutcome> {
  const now = new Date().toISOString();
  // Instant-site contract: every dashboard write bumps updated_at, so the
  // /api/content-hash fingerprint moves within the same second and open
  // tabs rebuild without refresh. A DB trigger (schema.sql) enforces the
  // same server-side — this stamp is defense-in-depth for rows written
  // before the trigger was installed. Always NOW (never trust the client's
  // timestamp — a stale tab must not freeze the fingerprint).
  const list: Record<string, unknown>[] = (Array.isArray(rows) ? rows : [rows]).map((r) => ({
    ...r,
    updated_at: now,
  }));
  if (list.length === 0) return { ok: true, dropped: [] };
  const dropped: string[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const sb = supabaseService();
    const payload = list.length === 1 ? (list[0] as Record<string, unknown>) : list;
    const { error } = await sb.from(table).upsert(payload, { onConflict: "id" });
    if (!error) {
      if (dropped.length > 0) {
        console.warn(
          `[admin-db] schema drift on "${table}": dropped [${dropped.join(", ")}] — re-run supabase/schema.sql in the SQL editor to keep the new fields.`,
        );
      }
      return { ok: true, dropped };
    }
    const msg = typeof error.message === "string" ? error.message : "";
    const col = MISSING_COLUMN_RE.exec(msg)?.[1] ?? MISSING_COLUMN_RE.exec(msg)?.[2];
    if (!col || col === "id" || dropped.includes(col)) {
      console.error(`[admin-db] upsert failed on "${table}":`, msg);
      return { ok: false, message: msg };
    }
    for (const r of list) delete r[col];
    dropped.push(col);
  }
  console.error(`[admin-db] upsert failed on "${table}" after drift retries`);
  return { ok: false, message: "Database error" };
}
