import type { AdminSettings, RailState, WorkStatus } from "@/components/admin/store";

/**
 * Work-availability + payment rails — the single source every badge reads.
 * The dashboard owns these values (Home command center + Settings, ONE
 * master switch); HomeShell builds them from the cloud settings row and
 * hands them to Navbar, UtilityBar, Footer, About and Contact, so every
 * badge flips together the moment the switch flips.
 */

export interface SiteAvailability {
  status: WorkStatus;
  note: string;
  noteFr: string;
  /** ISO date (YYYY-MM-DD) — "back on" deadline, "" = none. */
  until: string;
}

export interface PayRail {
  state: RailState;
  account: string;
  /** ISO date (YYYY-MM-DD) — "available on" deadline for soon rails. */
  at: string;
}

export interface SitePayments {
  vodafone: PayRail;
  taptap: PayRail;
  instapay: PayRail;
}

/** Fallbacks keep every badge meaningful when the cloud row is missing/old. */
export function availabilityFromSettings(
  s: AdminSettings | null | undefined,
): SiteAvailability {
  return {
    status: s?.workStatus === "unavailable" ? "unavailable" : "available",
    note: s?.workNote ?? "",
    noteFr: s?.workNoteFr ?? "",
    until: s?.workUntil ?? "",
  };
}

function rail(
  state: unknown,
  legacyOn: unknown,
  legacyActive: boolean,
  account: string,
  at: string,
): PayRail {
  const st: RailState =
    state === "active" || state === "soon" || state === "off"
      ? state
      : legacyOn === false
        ? "off"
        : legacyActive
          ? "active"
          : "soon";
  return { state: st, account, at };
}

export function paymentsFromSettings(s: AdminSettings | null | undefined): SitePayments {
  const r = (s ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  return {
    vodafone: rail(
      r.vodafoneState,
      r.vodafoneOn,
      true,
      str(r.vodafoneNumber) || "01065228072",
      str(r.vodafoneAt),
    ),
    taptap: rail(r.taptapState, r.taptapOn, true, "", str(r.taptapAt)),
    instapay: rail(
      r.instapayState,
      undefined,
      r.instapayOn === true,
      str(r.instapayHandle),
      str(r.instapayAt),
    ),
  };
}

/**
 * Badge label: available → the section's default text; unavailable → the
 * dashboard note (localized, falling back to EN) or the dictionary fallback.
 */
export function workLabel(
  a: SiteAvailability,
  lang: "en" | "fr",
  fallback: { available: string; unavailable: string },
): string {
  if (a.status === "available") return fallback.available;
  const localized = (lang === "fr" ? a.noteFr : a.note).trim();
  return localized || a.note.trim() || fallback.unavailable;
}

/**
 * Deterministic badge date (SSR-safe — pure function of props, no "now").
 * "2026-12-01" → "1 Dec 2026" / "1 déc. 2026", "" or garbage → "".
 */
export function formatBadgeDate(iso: string, lang: "en" | "fr"): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** " · Back 1 Dec 2026" / " · Retour 1 déc. 2026" — "" when no deadline. */
export function workDeadlineSuffix(a: SiteAvailability, lang: "en" | "fr"): string {
  const date = formatBadgeDate(a.until, lang);
  if (a.status !== "unavailable" || !date) return "";
  return lang === "fr" ? ` · Retour ${date}` : ` · Back ${date}`;
}

/** " · 1 Dec 2026" — soon-rail deadline suffix, "" when none. */
export function railDateSuffix(at: string, lang: "en" | "fr"): string {
  const date = formatBadgeDate(at, lang);
  return date ? ` · ${date}` : "";
}
