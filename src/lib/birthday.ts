/**
 * Birthday gate — BUDI day is October 24, every year, on Africa/Cairo time
 * (the owner lives in Suez, Egypt — visitors from anywhere see the same day).
 *
 * Rules:
 * - OPEN on Oct 24 (Cairo) for everyone, worldwide.
 * - PREVIEW on local/private hosts only (localhost, LAN) so the owner can
 *   rehearse the page before locking it. `?preview=1` NEVER unlocks prod.
 * - Pure functions, server+client safe (Intl only, no window).
 */

export const BIRTHDAY_MONTH = 10;
export const BIRTHDAY_DAY = 24;
const TZ = "Africa/Cairo";
const DAY_MS = 86_400_000;

export interface CairoDay {
  year: number;
  month: number;
  day: number;
}

/** Owner's calendar day in Cairo — the single source of truth for the gate. */
export function cairoToday(now: Date = new Date()): CairoDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? "1");
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function isBirthday(now: Date = new Date()): boolean {
  const c = cairoToday(now);
  return c.month === BIRTHDAY_MONTH && c.day === BIRTHDAY_DAY;
}

function isLeap(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Whole days from today (Cairo) to the next Oct 24 — 0 means TODAY. */
export function daysUntilBirthday(now: Date = new Date()): number {
  const c = cairoToday(now);
  const monthLen = (y: number, m: number): number =>
    m === 2 ? (isLeap(y) ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31;
  const dayOfYear = (y: number, m: number, d: number): number => {
    let n = d;
    for (let mm = 1; mm < m; mm += 1) n += monthLen(y, mm);
    return n;
  };
  const bday = dayOfYear(c.year, BIRTHDAY_MONTH, BIRTHDAY_DAY);
  const today = dayOfYear(c.year, c.month, c.day);
  if (today <= bday) return bday - today;
  const yearLen = isLeap(c.year) ? 366 : 365;
  return yearLen - today + dayOfYear(c.year + 1, BIRTHDAY_MONTH, BIRTHDAY_DAY);
}

/** Cairo UTC offset (ms) at a given instant — handles EET/EEST for us. */
function cairoOffsetMs(atMs: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(atMs));
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUTC - atMs;
}

/** Exact ms timestamp of the coming Oct 24 00:00:00 Cairo (for countdowns). */
export function nextBirthdayStartMs(nowMs: number = Date.now()): number {
  const c = cairoToday(new Date(nowMs));
  const alreadyPast = c.month > BIRTHDAY_MONTH || (c.month === BIRTHDAY_MONTH && c.day > BIRTHDAY_DAY);
  const year = alreadyPast ? c.year + 1 : c.year;
  const wall = Date.UTC(year, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0);
  return wall - cairoOffsetMs(wall);
}

/** Split ms into d/h/m/s for the countdown ribbon. */
export function splitCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(t / 86400),
    h: Math.floor((t % 86400) / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
  };
}

/** Hosts where the owner may rehearse the locked page (never prod). */
export function isPreviewHost(hostname: string): boolean {  const h = hostname.trim().toLowerCase();
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local")
  ) {
    return true;
  }
  if (h.startsWith("192.168.") || h.startsWith("10.")) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

/**
 * Dashboard-only preview grant — the console's "open your gift" button
 * stamps a 15-minute pass; /birthday honors it and nothing else does.
 * Client-only (window); never called on the server.
 */
const PREVIEW_KEY = "budi-bday-preview";

export function grantBirthdayPreview(minutes = 15): void {
  try {
    window.localStorage.setItem(PREVIEW_KEY, String(Date.now() + minutes * 60 * 1000));
  } catch {
    /* storage blocked */
  }
}

export function hasBirthdayPreview(): boolean {
  try {
    const raw = window.localStorage.getItem(PREVIEW_KEY);
    if (!raw) return false;
    if (Date.now() > Number(raw)) {
      window.localStorage.removeItem(PREVIEW_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
