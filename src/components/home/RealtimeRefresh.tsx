"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * True realtime: any dashboard write (services/skills/projects/certs/
 * settings) refreshes the server-rendered page within seconds — no reload,
 * no polling. Requires the `supabase_realtime` publication (realtime.sql).
 * Silent no-op when the database is unreachable.
 */
export default function RealtimeRefresh(): null {
  const router = useRouter();
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;
    try {
      const sb = supabaseBrowser();
      let timer = 0;
      const refresh = (): void => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => router.refresh(), 800);
      };
      channel = sb
        .channel("site-content")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "services" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "skills" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "certs" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "settings" },
          refresh,
        )
        .subscribe();
      return (): void => {
        window.clearTimeout(timer);
        try {
          channel?.unsubscribe();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* realtime unavailable — page still refreshes via ISR */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
