import { BadgeCheck, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import SmartImage from "@/components/SmartImage";
import type { RailState } from "@/components/admin/store";
import type { SiteAvailability } from "@/components/WorkStatus";
import { railDateSuffix, workDeadlineSuffix, workLabel } from "@/components/WorkStatus";
import { cn } from "@/lib/utils";

export type BadgeLang = "en" | "fr";

/* ── 1 · Availability (work) badge — dashboard master switch only ── */

export function AvailabilityBadge({
  availability,
  lang,
  availableText,
  unavailableText,
  className,
}: {
  availability: SiteAvailability;
  lang: BadgeLang;
  availableText: string;
  unavailableText: string;
  className?: string;
}): React.JSX.Element {
  const live = availability.status === "available";
  const label = workLabel(availability, lang, {
    available: availableText,
    unavailable: unavailableText,
  });
  const suffix = workDeadlineSuffix(availability, lang);
  return (
    <span
      title={`${label}${suffix}`}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase",
        live
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
          : "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span
          className={cn(
            "animate-ping-soft absolute inline-flex h-full w-full rounded-full",
            live ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            live ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
      </span>
      <span className="truncate">
        {label}
        {suffix}
      </span>
    </span>
  );
}

/* ── 2 · Payment rail badge — fully independent from availability ──
 * active → emerald · soon → amber (InstaPay yellow) · off → locked zinc.
 * Off NEVER disappears — it renders a lock so visitors know it's maintenance.
 */

export function payRailBadgeClass(state: RailState): string {
  if (state === "active")
    return "border-emerald-400/50 bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.35)]";
  if (state === "soon")
    return "border-amber-300/50 bg-amber-300/10 text-amber-200 shadow-[0_0_20px_rgba(252,211,77,0.35)]";
  return "border-white/15 bg-white/[0.05] text-white/45";
}

export function PayRailBadge({
  state,
  lang,
  at,
  className,
}: {
  state: RailState;
  lang: BadgeLang;
  at?: string;
  className?: string;
}): React.JSX.Element {
  const soonText = lang === "fr" ? "Bientôt" : "Coming soon";
  const activeText = lang === "fr" ? "Actif" : "Active";
  const offText = lang === "fr" ? "Maintenance" : "Maintenance";
  const dateSuffix = at ? railDateSuffix(at, lang) : "";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] uppercase",
        payRailBadgeClass(state),
        className,
      )}
    >
      {state === "off" ? (
        <Lock className="h-3 w-3" aria-hidden="true" />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "animate-ping-soft absolute inline-flex h-full w-full rounded-full",
              state === "active" ? "bg-emerald-400" : "bg-amber-300",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              state === "active" ? "bg-emerald-400" : "bg-amber-300",
            )}
          />
        </span>
      )}
      {state === "active" ? activeText : state === "soon" ? `${soonText}${dateSuffix}` : offText}
    </span>
  );
}

/* ── 3 · Verification badges — dashboard-owned list + fixed site seal ── */

export interface VerificationBadgeData {
  id: string;
  labelEn: string;
  labelFr: string;
  logo: string;
}

export function VerificationBadge({
  label,
  logo,
  className,
}: {
  label: string;
  logo?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-sky-300 uppercase shadow-[0_0_18px_rgba(56,189,248,0.3)]",
        className,
      )}
    >
      {logo ? (
        <span className="relative block h-4 w-4 overflow-hidden rounded-full bg-white p-px">
          <SmartImage src={logo} alt="" fill fit="contain" sizes="16px" />
        </span>
      ) : (
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Fixed site seal — always BUDI logo + verification, never editable per-badge. */
export function SiteVerifiedBadge({
  lang,
  className,
}: {
  lang: BadgeLang;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      title={lang === "fr" ? "Site vérifié — BUDI" : "Verified site — BUDI"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#d7fd44]/40 bg-[#d7fd44]/[0.07] py-1 pr-3 pl-1 font-mono text-[10px] tracking-[0.14em] text-[#d7fd44] uppercase shadow-[0_0_20px_rgba(215,253,68,0.3)]",
        className,
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-background">
        <span className="scale-[0.55]">
          <Logo />
        </span>
      </span>
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {lang === "fr" ? "Vérifié · BUDI" : "Verified · BUDI"}
    </span>
  );
}

/** Project sponsorship — signature of the site on the project card. */
export function SponsoredBadge({
  lang,
  className,
}: {
  lang: BadgeLang;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      title={lang === "fr" ? "Sponsorisé par BUDI" : "Sponsored by BUDI"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#ff3d00]/50 bg-[#ff3d00]/10 py-1 pr-2.5 pl-1 font-mono text-[9px] font-black tracking-[0.12em] text-[#ff8a3d] uppercase shadow-[0_0_16px_rgba(255,61,0,0.35)]",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-background">
        <span className="scale-[0.45]">
          <Logo />
        </span>
      </span>
      {lang === "fr" ? "Sponsorisé · BUDI" : "Sponsored · BUDI"}
    </span>
  );
}
