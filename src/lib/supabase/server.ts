import { createClient } from "@supabase/supabase-js";

/**
 * Server-side clients — import ONLY inside Route Handlers / Server Components.
 * - supabaseAnon(): public reads (RLS: visible rows only).
 * - supabaseService(): BYPASSES RLS — writes only, never leaves the server.
 */
// No generated Database schema yet — keep the client permissive until the
// schema is typed. The `never` defaults of untyped createClient break all
// queries, so we deliberately widen to SupabaseClient<any,...>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = ReturnType<typeof createClient<any>>;

export function supabaseAnon(): LooseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

export function supabaseService(): LooseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
