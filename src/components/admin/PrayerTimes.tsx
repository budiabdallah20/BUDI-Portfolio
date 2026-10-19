"use client";

import { useEffect, useMemo, useState } from "react";
import { MoonStar, RefreshCcw, Sunrise } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

interface Timings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  hijri: string;
}

const FALLBACK: Timings = {
  Fajr: "05:12",
  Sunrise: "06:38",
  Dhuhr: "11:52",
  Asr: "15:08",
  Maghrib: "17:32",
  Isha: "18:52",
  hijri: "",
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

/**
 * PrayerTimes — Suez daily prayers with love.
 * Aladhan API (Cairo coords work for Suez within a minute) + graceful
 * offline fallback + next-prayer countdown that ticks live.
 */
export default function PrayerTimes(): React.JSX.Element {
  const [data, setData] = useState<Timings>(FALLBACK);
  const [source, setSource] = useState<"live" | "offline">("offline");
  const [spinning, setSpinning] = useState(false);
  const now = useNow(1000);

  const load = (): void => {
    setSpinning(true);
    void (async (): Promise<void> => {
      try {
        // Suez, Egypt — method 5 (Egyptian General Authority of Survey).
        // Hard timeout — a stalled third party falls back to the offline card.
        const res = await fetch(
          "https://api.aladhan.com/v1/timingsByCity?city=Suez&country=Egypt&method=5",
          { signal: AbortSignal.timeout(10_000) },
        );
        if (!res.ok) throw new Error("busy");
        const json = (await res.json()) as {
          data?: { timings?: Record<string, string>; date?: { hijri?: { day?: string; month?: { en?: string }; year?: string } } };
        };
        const t = json.data?.timings;
        if (!t?.Fajr) throw new Error("empty");
        const cut = (v: string): string => v.slice(0, 5);
        const h = json.data?.date?.hijri;
        setData({
          Fajr: cut(t.Fajr),
          Sunrise: cut(t.Sunrise),
          Dhuhr: cut(t.Dhuhr),
          Asr: cut(t.Asr),
          Maghrib: cut(t.Maghrib),
          Isha: cut(t.Isha),
          hijri: h ? `${h.day} ${h.month?.en} ${h.year}` : "",
        });
        setSource("live");
      } catch {
        setData(FALLBACK);
        setSource("offline");
      } finally {
        setSpinning(false);
      }
    })();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () => [
      { id: "Fajr", t: data.Fajr },
      { id: "Sunrise", t: data.Sunrise },
      { id: "Dhuhr", t: data.Dhuhr },
      { id: "Asr", t: data.Asr },
      { id: "Maghrib", t: data.Maghrib },
      { id: "Isha", t: data.Isha },
    ],
    [data],
  );

  const next = useMemo(() => {
    if (!now) return null;
    const cur = now.getHours() * 60 + now.getMinutes();
    for (const r of rows) {
      const m = toMinutes(r.t);
      if (m > cur) {
        const diff = m - cur;
        return { id: r.id, inH: Math.floor(diff / 60), inM: diff % 60 };
      }
    }
    const first = rows[0];
    if (!first) return null;
    const diff = 24 * 60 - cur + toMinutes(first.t);
    return { id: first.id, inH: Math.floor(diff / 60), inM: diff % 60 };
  }, [now, rows]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-gradient-to-br from-[#d4af37]/[0.08] via-transparent to-[#0b0b0c] p-5">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-[#d4af37] uppercase">
          <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
          Suez · Prayer times
        </p>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh prayer times"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-white/50 uppercase transition-colors hover:border-[#d4af37]/50 hover:text-[#d4af37]"
        >
          <RefreshCcw className={cn("h-3 w-3", spinning && "animate-spin")} aria-hidden="true" />
          {source === "live" ? "Live" : "Offline"}
        </button>
      </div>
      {data.hijri !== "" && (
        <p className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-white/45 uppercase">{data.hijri} Hijri</p>
      )}
      {next && (
        <p className="mt-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-2 text-center text-sm font-bold text-[#f9edb0]">
          Next: {next.id} · in {next.inH > 0 ? `${next.inH}h ` : ""}{next.inM}m
        </p>
      )}
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {rows.map((r) => {
          const active = next?.id === r.id;
          return (
            <li
              key={r.id}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-center transition-colors",
                active ? "border-[#d4af37]/60 bg-[#d4af37]/15 shadow-[0_0_18px_rgba(212,175,55,0.3)]" : "border-white/10 bg-black/30",
              )}
            >
              <p className={cn("flex items-center justify-center gap-1 font-mono text-[9px] tracking-[0.18em] uppercase", active ? "text-[#f9edb0]" : "text-white/45")}>
                {r.id === "Sunrise" && <Sunrise className="h-3 w-3" aria-hidden="true" />}
                {r.id}
              </p>
              <p className={cn("font-display mt-0.5 text-lg font-black tabular-nums", active ? "text-[#f9edb0]" : "text-white")} dir="ltr">
                {r.t}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-center font-mono text-[9px] tracking-[0.14em] text-white/30 uppercase">
        Made with ♥ for Suez · method EG
      </p>
    </div>
  );
}
