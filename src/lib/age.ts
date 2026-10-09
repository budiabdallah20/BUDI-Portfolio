/** Pure date math for the live About counters. Inputs are validated. */

export function parseISODate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fullYears(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && to.getDate() < from.getDate())) years -= 1;
  return Math.max(0, years);
}

export function totalDays(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

export function clockParts(from: Date, to: Date): { h: string; m: string; s: string } {
  const remainder = Math.max(0, to.getTime() - from.getTime()) % 86_400_000;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return {
    h: pad(Math.floor(remainder / 3_600_000)),
    m: pad(Math.floor((remainder % 3_600_000) / 60_000)),
    s: pad(Math.floor((remainder % 60_000) / 1000)),
  };
}

export function daysToBirthday(from: Date, to: Date): number {
  const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(to);
  let next = new Date(to.getFullYear(), from.getMonth(), from.getDate());
  if (next.getTime() < today.getTime()) {
    next = new Date(to.getFullYear() + 1, from.getMonth(), from.getDate());
  }
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
