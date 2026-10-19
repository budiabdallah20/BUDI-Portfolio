"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, CheckCheck, Download, Send, Trash2 } from "lucide-react";
import { adminSecret } from "./remote";
import { localNotify, notificationsSupported } from "@/lib/azan";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  read: boolean;
  created_at: string;
}

const PREFS_KEY = "budi-notify-prefs";

interface Prefs {
  prayer: boolean;
  birthday: boolean;
  visitor: boolean;
  appointments: boolean;
}

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      return { prayer: p.prayer !== false, birthday: p.birthday !== false, visitor: p.visitor !== false, appointments: p.appointments !== false };
    }
  } catch {
    /* ignore */
  }
  return { prayer: true, birthday: true, visitor: true, appointments: true };
}

/** Base64url → Uint8Array (VAPID key for pushManager.subscribe). */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Resolve the active service-worker registration, or reject after `timeoutMs`.
 * `navigator.serviceWorker.ready` NEVER settles while no worker is registered
 * (dev, or a non-secure origin), so awaiting it directly left the push buttons
 * spinning forever. A bounded wait fails fast with a real message instead.
 */
function swRegistration(timeoutMs = 4000): Promise<ServiceWorkerRegistration> {
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("service worker unavailable")),
      timeoutMs,
    );
    navigator.serviceWorker.ready.then(
      (reg) => {
        window.clearTimeout(timer);
        resolve(reg);
      },
      (err: unknown) => {
        window.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error("service worker unavailable"));
      },
    );
  });
}

/**
 * NotificationsInbox — the owner's bell, dashboard only.
 * Local permission + push subscription + Supabase inbox (poll 30s) +
 * test send + per-type toggles + PWA install button.
 */
export default function NotificationsInbox(): React.JSX.Element {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>({ prayer: true, birthday: true, visitor: true, appointments: true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  /** True once the server rejects us (expired PIN / lockout) — the 30s poll
   *  stops instead of staining the console red every tick. Next successful
   *  dashboard action re-arms it via window focus. */
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      setPerm(notificationsSupported() ? Notification.permission : "unsupported");
      setPrefs(loadPrefs());
      const onInstallable = (): void => setInstallable(true);
      window.addEventListener("budi:installable", onInstallable);
      if ((window as unknown as { __budiInstallPrompt?: Event }).__budiInstallPrompt) setInstallable(true);
      void checkSubscription();
      return (): void => {
        window.removeEventListener("budi:installable", onInstallable);
      };
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSubscription = async (): Promise<void> => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const reg = await swRegistration();
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      /* ignore */
    }
  };

  const fetchInbox = useCallback(async (): Promise<void> => {
    // No secret, no request: firing an unauthenticated poll would only
    // stain the console red. The login flow sets the secret, and window
    // focus re-arms the poll below.
    if (adminSecret().trim() === "") {
      setLocked(true);
      return;
    }
    try {
      const res = await fetch("/api/notify?limit=30", {
        headers: { "x-admin-secret": adminSecret() },
      });
      if (res.status === 401 || res.status === 429) {
        // Stale secret or lockout — stop polling quietly (no console spam);
        // the next dashboard save bounces to login and re-arms on focus.
        setLocked(true);
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        return;
      }
      if (!res.ok) return;
      setLocked(false);
      const json = (await res.json()) as { items?: InboxItem[]; unread?: number };
      setItems(Array.isArray(json.items) ? json.items : []);
      setUnread(typeof json.unread === "number" ? json.unread : 0);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    void fetchInbox();
    timerRef.current = window.setInterval(() => void fetchInbox(), 30000);
    const rearm = (): void => {
      if (timerRef.current !== null) return;
      setLocked(false);
      void fetchInbox();
      timerRef.current = window.setInterval(() => void fetchInbox(), 30000);
    };
    window.addEventListener("focus", rearm);
    return (): void => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      window.removeEventListener("focus", rearm);
    };
  }, [fetchInbox]);

  const flash = (m: string): void => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2600);
  };

  const askPermission = async (): Promise<void> => {
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p === "granted") {
        localNotify("🔔 BUDI notifications on", "هتوصلك تنبيهات الصلاة والزوار والمواعيد هنا.", "hello");
        flash("Permission granted ✓");
      }
    } catch {
      flash("Permission blocked by browser");
    }
  };

  const subscribePush = async (): Promise<void> => {
    setBusy(true);
    try {
      const key = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
      if (key === "") {
        flash("VAPID key missing — add it to env");
        return;
      }
      const reg = await swRegistration();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
      });
      if (!res.ok) throw new Error("save failed");
      setSubscribed(true);
      flash("This device subscribed ✓");
    } catch {
      flash("Subscribe failed — HTTPS + installed PWA needed");
    } finally {
      setBusy(false);
    }
  };

  const unsubscribePush = async (): Promise<void> => {
    setBusy(true);
    try {
      const reg = await swRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe().catch(() => undefined);
      }
      setSubscribed(false);
      flash("Unsubscribed");
    } catch {
      flash("Failed");
    } finally {
      setBusy(false);
    }
  };

  const installApp = async (): Promise<void> => {
    try {
      const ev = (window as unknown as { __budiInstallPrompt?: { prompt: () => void } }).__budiInstallPrompt;
      if (ev) {
        ev.prompt();
        setInstallable(false);
      } else {
        flash("Use browser menu → Install / Add to Home Screen");
      }
    } catch {
      /* ignore */
    }
  };

  const testSend = async (): Promise<void> => {
    setBusy(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ title: "🔔 BUDI test", body: "الإشعارات شغالة تمام يا كبير ✓", url: "/admin" }),
      });
      const json = (await res.json()) as { delivered?: number };
      flash(res.ok ? `Sent → ${json.delivered ?? 0} device(s)` : "Send failed");
      void fetchInbox();
    } catch {
      flash("Send failed");
    } finally {
      setBusy(false);
    }
  };

  const markAll = async (): Promise<void> => {
    try {
      await fetch("/api/notify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const togglePref = (k: keyof Prefs): void => {
    setPrefs((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-gradient-to-br from-[#d4af37]/[0.07] via-transparent to-transparent p-5">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-[#d4af37] uppercase">
          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          Notifications · {locked ? "paused — re-login" : unread > 0 ? `${unread} new` : "all read"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {installable && (
            <button type="button" onClick={installApp} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#d4af37] px-2.5 py-1.5 font-mono text-[9px] font-black tracking-[0.1em] text-black uppercase transition-transform hover:-translate-y-0.5">
              <Download className="h-3 w-3" aria-hidden="true" /> Install app
            </button>
          )}
          {perm === "default" && (
            <button type="button" onClick={askPermission} className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#d4af37]/50 px-2.5 py-1.5 font-mono text-[9px] font-black tracking-[0.1em] text-[#d4af37] uppercase hover:bg-[#d4af37]/10">
              <Bell className="h-3 w-3" aria-hidden="true" /> Enable
            </button>
          )}
          {perm === "granted" && !subscribed && (
            <button type="button" onClick={subscribePush} disabled={busy} className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-400/50 px-2.5 py-1.5 font-mono text-[9px] font-black tracking-[0.1em] text-emerald-300 uppercase hover:bg-emerald-400/10 disabled:opacity-50">
              <Bell className="h-3 w-3" aria-hidden="true" /> Subscribe device
            </button>
          )}
          {perm === "granted" && subscribed && (
            <button type="button" onClick={unsubscribePush} disabled={busy} className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.1em] text-white/50 uppercase hover:text-white disabled:opacity-50">
              <BellOff className="h-3 w-3" aria-hidden="true" /> Unsubscribe
            </button>
          )}
          <button type="button" onClick={testSend} disabled={busy} className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.1em] text-white/60 uppercase hover:border-white/40 hover:text-white disabled:opacity-50">
            <Send className="h-3 w-3" aria-hidden="true" /> Test
          </button>
          {unread > 0 && (
            <button type="button" onClick={markAll} className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.1em] text-white/60 uppercase hover:text-white">
              <CheckCheck className="h-3 w-3" aria-hidden="true" /> Read all
            </button>
          )}
        </div>
      </div>

      {perm === "denied" && (
        <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 font-mono text-[10px] text-amber-200">
          Browser blocked notifications — allow them in site settings. On iPhone: install the app first, then allow.
        </p>
      )}
      {perm === "unsupported" && (
        <p className="mt-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] text-white/40">
          This browser has no Notification API — use Chrome / Safari 16.4+.
        </p>
      )}
      {msg && <p className="mt-2 font-mono text-[10px] text-emerald-300">{msg}</p>}

      {/* Per-type toggles — the ReminderEngine reads these */}
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Notification types">
        {(Object.keys(prefs) as (keyof Prefs)[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => togglePref(k)}
            aria-pressed={prefs[k]}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 font-mono text-[9px] tracking-[0.12em] uppercase transition-colors",
              prefs[k] ? "border-[#d4af37]/60 bg-[#d4af37]/15 text-[#f9edb0]" : "border-white/10 text-white/35 hover:text-white",
            )}
          >
            {k} {prefs[k] ? "on" : "off"}
          </button>
        ))}
      </div>

      {/* Inbox */}
      <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center font-mono text-[10px] tracking-[0.14em] text-white/35 uppercase">
            Empty inbox — visits, errors & reminders land here ♥
          </li>
        )}
        {items.map((n) => (
          <li key={n.id} className={cn("flex items-start gap-2 rounded-xl border px-3 py-2", n.read ? "border-white/5 bg-black/20 opacity-60" : "border-[#d4af37]/30 bg-[#d4af37]/[0.06]")}>
            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-white/20" : "bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.9)]")} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{n.title}</p>
              {n.body !== "" && <p className="truncate text-[11px] text-white/50">{n.body}</p>}
              <p className="font-mono text-[9px] text-white/30 tabular-nums">
                {n.type} · {new Date(n.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Trash2 className="h-3 w-3 shrink-0 text-white/20" aria-hidden="true" />
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[9px] tracking-[0.1em] text-white/30 uppercase">
        iPhone needs the installed app + permission · Android works in browser too
      </p>
    </div>
  );
}
