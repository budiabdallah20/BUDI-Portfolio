"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, ChevronLeft, ChevronRight } from "lucide-react";
import { BIRTHDAY_DAY, BIRTHDAY_MONTH } from "@/lib/birthday";
import { cn } from "@/lib/utils";

const APPT_KEY = "budi-admin-appointments";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

interface DayAppt {
  done: boolean;
}

function loadDots(): Map<string, { total: number; open: number }> {
  const map = new Map<string, { total: number; open: number }>();
  try {
    const raw = window.localStorage.getItem(APPT_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return map;
    for (const a of arr) {
      if (!a || typeof a !== "object") continue;
      const r = a as Record<string, unknown>;
      if (typeof r.title !== "string" || r.title === "" || typeof r.date !== "string" || r.date === "") continue;
      const cur = map.get(r.date) ?? { total: 0, open: 0 };
      cur.total += 1;
      if (r.done !== true) cur.open += 1;
      map.set(r.date, cur);
    }
  } catch {
    /* ignore */
  }
  return map;
}

function dayStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * YearCalendar — glass rectangular month display, current year only.
 * Weekday strip on top, a date display screen beneath it, then the month
 * grid. January ↔ December stepper. Oct 24 glows gold (BUDI day ♥).
 * Appointment dots mirror the Appointments card (read-only here).
 */
export default function YearCalendar(): React.JSX.Element {
  const year = new Date().getFullYear();
  const today = new Date();
  const todayStr = dayStr(today.getFullYear(), today.getMonth(), today.getDate());
  const [month, setMonth] = useState(today.getMonth());
  const [dots, setDots] = useState<Map<string, { total: number; open: number }>>(new Map());

  useEffect(() => {
    setDots(loadDots());
    const onStorage = (e: StorageEvent): void => {
      if (e.key === APPT_KEY) setDots(loadDots());
    };
    window.addEventListener("storage", onStorage);
    const iv = window.setInterval(() => setDots(loadDots()), 5000);
    return (): void => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(iv);
    };
  }, []);

  const cells = useMemo(() => {
    // Week starts Saturday (Egypt).
    const first = (new Date(year, month, 1).getDay() + 1) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < first; i += 1) out.push(null);
    for (let d = 1; d <= days; d += 1) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const monthAppts = useMemo(() => {
    let total = 0;
    for (const [ds, v] of dots) {
      if (ds.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) total += v.total;
    }
    return total;
  }, [dots, year, month]);

  const isBirthday = (d: number | null): boolean =>
    d !== null && month === BIRTHDAY_MONTH - 1 && d === BIRTHDAY_DAY;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      {/* Header — month stepper, current year only */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <button
          type="button"
          onClick={() => setMonth((m) => Math.max(0, m - 1))}
          disabled={month === 0}
          aria-label="Previous month"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[#d4af37]/50 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="text-center">
          <span className="font-display text-lg font-black">{MONTHS[month]}</span>{" "}
          <span className="font-mono text-xs text-[#d4af37] tabular-nums">{year}</span>
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => Math.min(11, m + 1))}
          disabled={month === 11}
          aria-label="Next month"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[#d4af37]/50 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Weekday strip */}
      <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
        {WEEKDAYS.map((w) => (
          <p key={w} className="py-2 text-center font-mono text-[9px] tracking-[0.2em] text-white/35 uppercase">
            {w}
          </p>
        ))}
      </div>

      {/* Date display screen */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-2.5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase">
          Today · <span className="text-[#f9edb0] tabular-nums" dir="ltr">{todayStr}</span>
        </p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase tabular-nums">
          {monthAppts > 0 ? `${monthAppts} appt${monthAppts === 1 ? "" : "s"} this month` : "No appointments this month"}
        </p>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 p-2" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`e-${i}`} className="min-h-11 sm:min-h-13" />;
          const ds = dayStr(year, month, d);
          const ap = dots.get(ds);
          const bday = isBirthday(d);
          const isTodayCell = ds === todayStr;
          return (
            <span
              key={ds}
              role="gridcell"
              aria-label={`${ds}${bday ? " — BUDI birthday" : ""}${ap ? ` — ${ap.total} appointment(s)` : ""}`}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-start gap-0.5 rounded-lg pt-1.5 pb-1 sm:min-h-13",
                bday && "bg-[#d4af37]/15",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] tabular-nums",
                  bday
                    ? "bg-[#d4af37] font-black text-black shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                    : isTodayCell
                      ? "border border-[#d4af37]/60 text-[#f9edb0]"
                      : "text-white/70",
                )}
              >
                {d}
              </span>
              {bday ? (
                <Cake className="h-3 w-3 text-[#d4af37]" aria-hidden="true" />
              ) : ap ? (
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: Math.min(3, ap.total) }).map((_, k) => (
                    <span key={k} className={cn("h-1 w-1 rounded-full", ap.open > 0 ? "bg-[#38bdf8]" : "bg-white/25")} />
                  ))}
                </span>
              ) : (
                <span className="h-1" aria-hidden="true" />
              )}
            </span>
          );
        })}
      </div>

      {/* Birthday note */}
      <p className="flex items-center justify-center gap-1.5 border-t border-white/10 bg-black/20 px-3 py-2 text-center font-mono text-[9px] tracking-[0.12em] text-[#d4af37]/80 uppercase">
        <Cake className="h-3 w-3" aria-hidden="true" />
        Oct 24 glows gold — BUDI day ♥ · reminder lands Oct 23
      </p>
    </div>
  );
}
