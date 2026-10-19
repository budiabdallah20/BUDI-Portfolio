import { createClient } from "@supabase/supabase-js";

/**
 * Server-side clients — import ONLY inside Route Handlers / Server Components.
 * - supabaseAnon(): public reads (RLS: visible rows only).
 * - supabaseService(): BYPASSES RLS — writes only, never leaves the server.
 *
 * Env values are trimmed: stray spaces in .env (" https://…") used to silently
 * produce an invalid URL and a confusing outage.
 *
 * TIMEOUT: every DB call gets a hard 15s ceiling. Without it a stalled
 * Supabase connection hangs the route handler until the platform kills it
 * (visitors see a spinning page, not an error). If supabase-js passes its
 * own abort signal (cancellation support), both are combined — never dropped.
 */
// No generated Database schema yet — keep the client permissive until the
// schema is typed. The `never` defaults of untyped createClient break all
// queries, so we deliberately widen to SupabaseClient<any,...>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = ReturnType<typeof createClient<any>>;

const SUPABASE_TIMEOUT_MS = 15_000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

export function supabaseAnon(): LooseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
    { global: { fetch: fetchWithTimeout } },
  );
}

export function supabaseService(): LooseClient {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}
