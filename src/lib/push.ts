import { supabaseService } from "@/lib/supabase/server";
import type { PushSubscription } from "web-push";

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

let configured = false;

async function webpush(): Promise<typeof import("web-push") | null> {
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  if (pub === "" || priv === "") return null;
  try {
    const mod = await import("web-push");
    if (!configured) {
      mod.setVapidDetails(
        (process.env.VAPID_SUBJECT ?? "https://budi-portfolio.vercel.app").trim(),
        pub,
        priv,
      );
      configured = true;
    }
    return mod;
  } catch {
    return null;
  }
}

/**
 * Fan-out a push to every subscribed device. Prunes dead (410/404)
 * subscriptions. Never throws — returns delivered/pruned counts.
 */
export async function fanoutPush(payload: PushPayload): Promise<{ delivered: number; pruned: number }> {
  const out = { delivered: 0, pruned: 0 };
  try {
    const wp = await webpush();
    if (!wp) return out;
    const sb = supabaseService();
    const res = await sb.from("push_subscriptions").select("*").limit(200);
    const subs = ((res.data as unknown[] | null) ?? []) as { endpoint: string; p256dh: string; auth: string }[];
    if (subs.length === 0) return out;
    const body = JSON.stringify({
      title: payload.title.slice(0, 120),
      body: (payload.body ?? "").slice(0, 300),
      url: payload.url ?? "/admin",
      tag: payload.tag ?? "budi",
    });
    for (const s of subs) {
      if (!s.endpoint || !s.p256dh || !s.auth) continue;
      const subscription: PushSubscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await wp.sendNotification(subscription, body, { TTL: 86400 });
        out.delivered += 1;
      } catch (e) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          out.pruned += 1;
          void sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint).then(() => undefined);
        }
      }
    }
  } catch {
    /* push is auxiliary */
  }
  return out;
}
