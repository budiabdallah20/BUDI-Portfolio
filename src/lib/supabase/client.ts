import { createClient } from "@supabase/supabase-js";

/** Browser (anon key) — public reads + increment RPCs only. RLS enforces it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = ReturnType<typeof createClient<any>>;
let browser: LooseClient | null = null;

export function supabaseBrowser(): LooseClient {
  if (!browser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    browser = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );
  }
  return browser;
}
