"use client";

import { useEffect, useRef } from "react";
import { BIRTHDAY_DAY, BIRTHDAY_MONTH, cairoToday } from "@/lib/birthday";
import { localNotify, playAzan5s } from "@/lib/azan";
import { adminSecret } from "./remote";

const PREFS_KEY = "budi-notify-prefs";
const SEEN_KEY = "budi-reminder-seen";

interface Prefs {
  prayer: boolean;
  birthday: boolean;
  visitor: boolean;
  appointments: boolean;
}

function prefs(): Prefs {
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

function seen(): Record<string, number> {
  try {
    return (JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "{}") ?? {}) as Record<string, number>;
  } catch {
    return {};
  }
}

function markSeen(key: string): void {
  try {
    const s = seen();
    s[key] = Date.now();
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function canNotify(): boolean {
  try {
    return "Notification" in window && Notification.permission === "granted" && document.visibilityState === "visible";
  } catch {
    return false;
  }
}

const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

interface Timings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

async function fetchTimings(): Promise<Timings | null> {
  try {
    const res = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Suez&country=Egypt&method=5");
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { timings?: Record<string, string> } };
    const t = json.data?.timings;
    if (!t?.Fajr) return null;
    const cut = (v: string): string => v.slice(0, 5);
    return { Fajr: cut(t.Fajr), Dhuhr: cut(t.Dhuhr), Asr: cut(t.Asr), Maghrib: cut(t.Maghrib), Isha: cut(t.Isha) };
  } catch {
    return null;
  }
}

function minutesUntil(hhmm: string, now: Date): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.POSITIVE_INFINITY;
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  let diff = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diff < -60) diff += 24 * 60; // tomorrow's same prayer
  return diff;
}

interface Appt {
  title: string;
  date: string;
  time: string;
  done: boolean;
}

function loadAppointments(): Appt[] {
  try {
    const raw = window.localStorage.getItem("budi-admin-appointments");
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
      .map((a) => ({
        title: typeof a.title === "string" ? a.title : "",
        date: typeof a.date === "string" ? a.date : "",
        time: typeof a.time === "string" ? a.time : "",
        done: a.done === true,
      }))
      .filter((a) => a.title !== "" && a.date !== "" && !a.done);
  } catch {
    return [];
  }
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * ReminderEngine — dashboard-only scheduler (runs while console is open).
 * Prayer (15-min heads-up + azan on time) · birthday eve/day ·
 * appointments (30-min + tomorrow digest). Fires local Notifications and
 * writes inbox rows via /api/notify (admin secret header).
 */
export default function ReminderEngine(): React.JSX.Element | null {
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const headers = (): Record<string, string> => ({
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret(),
    });

    const inbox = (type: string, title: string, body: string): void => {
      try {
        void fetch("/api/notify", { method: "POST", headers: headers(), body: JSON.stringify({ type, title, body, url: "/admin", push: false }) }).catch(() => undefined);
      } catch {
        /* ignore */
      }
    };

    const later = (ms: number, fn: () => void): void => {
      if (ms < 0 || ms > 12 * 60 * 60 * 1000) return;
      timers.current.push(window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms));
    };

    const arm = (): void => {
      void (async (): Promise<void> => {
      const p = prefs();
      const s = seen();
      const now = new Date();
      const cairo = cairoToday(now);

      // ── Birthday: Oct 24 (Cairo) ──
      if (p.birthday) {
        const isEve = cairo.month === BIRTHDAY_MONTH && cairo.day === BIRTHDAY_DAY - 1;
        const isDay = cairo.month === BIRTHDAY_MONTH && cairo.day === BIRTHDAY_DAY;
        const yearKey = `${cairo.year}`;
        if (isEve && s[`bday-eve-${yearKey}`] !== 1 && canNotify()) {
          markSeen(`bday-eve-${yearKey}`);
          s[`bday-eve-${yearKey}`] = 1;
          const msg = "🎂 بكرة عيد ميلادك يا بودي! جهز التورتة والفرحة — سنة جديدة وإنجازات أكبر بإذن الله ♥";
          localNotify("🎂 بكرة عيد ميلادك!", msg, "bday-eve");
          inbox("birthday", "🎂 تذكير: عيد ميلادك بكرة", msg);
        }
        if (isDay && s[`bday-${yearKey}`] !== 1 && canNotify()) {
          markSeen(`bday-${yearKey}`);
          s[`bday-${yearKey}`] = 1;
          const msg = "🎉 كل سنة وانت طيب يا بودي! عيد ميلاد سعيد — ربنا يحقق كل اللي نفسك فيه يا كبير ♥🎂";
          localNotify("🎉 عيد ميلاد سعيد يا بودي!", msg, "bday");
          inbox("birthday", "🎉 عيد ميلاد سعيد!", msg);
        }
      }

      // ── Prayer: 15-min heads-up + azan on time ──
      if (p.prayer) {
        const timings = await fetchTimings();
        if (!cancelled && timings) {
          const n = new Date();
          for (const [id, t] of Object.entries(timings)) {
            const mins = minutesUntil(t, n);
            const ar = PRAYER_AR[id] ?? id;
            const dayKey = localDateStr(n);
            if (mins >= 14 && mins <= 16 && s[`p-${id}-${dayKey}`] !== 1) {
              later(
                (mins - 15) * 60000 + 5000,
                () => {
                  markSeen(`p-${id}-${dayKey}`);
                  if (canNotify()) localNotify(`🕌 صلاة ${ar} بعد 15 دقيقة`, "جهز نفسك يا كبير — الصلاة اقتربت ♥", `p15-${id}`);
                },
              );
            } else if (mins === 15 && s[`p-${id}-${dayKey}`] !== 1) {
              markSeen(`p-${id}-${dayKey}`);
              if (canNotify()) localNotify(`🕌 صلاة ${ar} بعد 15 دقيقة`, "جهز نفسك يا كبير — الصلاة اقتربت ♥", `p15-${id}`);
            }
            if (mins >= 0 && mins <= 60) {
              later(mins * 60000, () => {
                playAzan5s();
                if (canNotify()) localNotify(`🕌 حان الآن صلاة ${ar}`, "الله أكبر — تقبل الله منا ومنك ♥", `p0-${id}`);
                inbox("prayer", `🕌 صلاة ${ar}`, "حان وقت الصلاة — تقبل الله ♥");
              });
            }
          }
        }
      }

      // ── Appointments: 30-min heads-up + tomorrow digest ──
      if (p.appointments) {
        const appts = loadAppointments();
        const today = localDateStr(now);
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        const tomorrow = localDateStr(tmr);
        for (const a of appts) {
          if (a.date === today && a.time !== "") {
            const [h, m] = a.time.split(":").map((x) => parseInt(x, 10));
            if (Number.isFinite(h) && Number.isFinite(m)) {
              const target = new Date(now);
              target.setHours(h, m, 0, 0);
              const ms = target.getTime() - now.getTime() - 30 * 60000;
              const key = `a-${a.title}-${a.date}-${a.time}`;
              if (ms > 0 && s[key] !== 1) {
                later(ms, () => {
                  markSeen(key);
                  if (canNotify()) localNotify("📅 معاد بعد 30 دقيقة", a.title, "appt");
                });
              }
            }
          }
        }
        const tmrCount = appts.filter((a) => a.date === tomorrow).length;
        if (tmrCount > 0 && s[`digest-${tomorrow}`] !== 1) {
          markSeen(`digest-${tomorrow}`);
          later(5000, () => {
            if (canNotify()) localNotify("📅 عندك مواعيد بكرة", `${tmrCount} ${tmrCount === 1 ? "معاد" : "مواعيد"} متسجلة لبكرة — بالتوفيق يا كبير ♥`, "digest");
          });
        }
      }
      })();
    };

    arm();
    // Re-arm every 10 min (new timings / appointments / prefs).
    const iv = window.setInterval(() => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
      if (!cancelled) arm();
    }, 10 * 60 * 1000);

    return (): void => {
      cancelled = true;
      window.clearInterval(iv);
      for (const t of timers.current) window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
