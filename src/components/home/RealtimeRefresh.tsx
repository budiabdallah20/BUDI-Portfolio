"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * True realtime: ANY dashboard write (add/edit/delete/hide for projects,
 * services, skills, certs — work status, payment rails, verification
 * badges, hero/about images, like votes) repaints open site tabs in ~1-2s.
 * No reload, no action.
 *
 * Two paths, one guard:
 *  1. PRIMARY — Supabase realtime events (read-only anon channel, ~0.5s).
 *  2. FALLBACK — fingerprint poll every 2.5s (covers dead realtime).
 * BOTH paths funnel through a hash check (`/api/content-hash`, ~100 bytes):
 * the page rebuilds ONLY when the fingerprint actually moves. Duplicate /
 * no-op events and dashboard bulk-saves collapse to zero-or-one refresh —
 * a refresh storm is structurally impossible.
 * Silent no-op when the database is unreachable.
 *
 * Speed contract: every dashboard write stamps updated_at=now() server-side
 * (_db.ts + DB trigger in schema.sql), so the hash moves in the SAME second
 * as the write — the poll can never miss an edit, it only bounds latency.
 */
const POLL_MS = 2500;
const REFRESH_DEBOUNCE_MS = 350;

interface HashJson {
  at?: string;
  counts?: object;
  likes?: number;
}

export default function RealtimeRefresh(): null {
  const router = useRouter();
  const fingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;
    let stopped = false;
    try {
      const sb = supabaseBrowser();
      let timer = 0;
      const scheduleRefresh = (): void => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (!stopped) router.refresh();
        }, REFRESH_DEBOUNCE_MS);
      };
      /** Fetch the fingerprint; rebuild only when it MOVED. */
      const check = async (): Promise<void> => {
        if (stopped || document.visibilityState !== "visible") return;
        try {
          const res = await fetch("/api/content-hash", { cache: "no-store" });
          if (!res.ok || stopped) return;
          const json = (await res.json()) as HashJson;
          const fp = `${json.at ?? ""}|${JSON.stringify(json.counts ?? {})}|${json.likes ?? 0}`;
          if (fingerprintRef.current === null) {
            fingerprintRef.current = fp;
            return;
          }
          if (fp !== fingerprintRef.current) {
            fingerprintRef.current = fp;
            scheduleRefresh();
          }
        } catch {
          /* hash unreachable — realtime path still active */
        }
      };
      /** Realtime event → verify via hash (debounced), never blind refresh. */
      let eventTimer = 0;
      const onEvent = (): void => {
        window.clearTimeout(eventTimer);
        eventTimer = window.setTimeout(() => {
          void check();
        }, 120);
      };
      channel = sb
        .channel("site-content")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "services" },
          onEvent,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "skills" },
          onEvent,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          onEvent,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "certs" },
          onEvent,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "settings" },
          onEvent,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "likes" },
          onEvent,
        )
        .subscribe();
      const poller = window.setInterval(check, POLL_MS);
      const onFocus = (): void => {
        void check();
      };
      // Seed the fingerprint silently (no refresh on first paint).
      void check();
      document.addEventListener("visibilitychange", onFocus);
      window.addEventListener("focus", onFocus);
      return (): void => {
        stopped = true;
        window.clearTimeout(timer);
        window.clearTimeout(eventTimer);
        window.clearInterval(poller);
        document.removeEventListener("visibilitychange", onFocus);
        window.removeEventListener("focus", onFocus);
        try {
          channel?.unsubscribe();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* realtime unavailable — fingerprint poll still covers updates */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
