import { supabaseService } from "@/lib/supabase/server";

export type NotifyType = "visit" | "error" | "prayer" | "birthday" | "appointment" | "info";

/**
 * Server-only notification writer — service_role bypasses RLS.
 * Best-effort: never throws, always resolves (callers must not fail
 * their main job because the inbox write hiccuped).
 */
export async function insertNotification(input: {
  type: NotifyType;
  title: string;
  body?: string;
  url?: string;
}): Promise<void> {
  try {
    const sb = supabaseService();
    await sb.from("notifications").insert({
      type: input.type,
      title: input.title.slice(0, 120),
      body: (input.body ?? "").slice(0, 500),
      url: (input.url ?? "/admin").slice(0, 300),
    });
  } catch {
    /* inbox is auxiliary — swallow */
  }
}

/** Latest notification of a type newer than `withinMs` (for throttling). */
export async function recentOfType(type: NotifyType, withinMs: number): Promise<boolean> {
  try {
    const sb = supabaseService();
    const since = new Date(Date.now() - withinMs).toISOString();
    const res = await sb
      .from("notifications")
      .select("id")
      .eq("type", type)
      .gte("created_at", since)
      .limit(1);
    return ((res.data as unknown[] | null) ?? []).length > 0;
  } catch {
    return true; // fail-closed: don't spam on lookup errors
  }
}
