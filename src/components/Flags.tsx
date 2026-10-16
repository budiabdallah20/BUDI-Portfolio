import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Flags — Egypt (inline SVG) + the official Suez governorate flag
 * (downloaded file) + Britain + France for the languages counter.
 */

const flagClass = "block h-4 w-6 overflow-hidden rounded-[3px] ring-1 ring-white/25 object-cover";

/** Egypt — red #CE1126 · white · black, gold eagle of Saladin. */
export function EgyptFlag({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 36 24"
      role="img"
      aria-label="Egypt flag"
      className={cn("block h-4 w-6 overflow-hidden rounded-[3px] ring-1 ring-white/25", className)}
    >
      <rect x="0" y="0" width="36" height="8" fill="#CE1126" />
      <rect x="0" y="8" width="36" height="8" fill="#ffffff" />
      <rect x="0" y="16" width="36" height="8" fill="#000000" />
      {/* Eagle of Saladin — simplified gold silhouette */}
      <g transform="translate(18,12)" fill="#C09300">
        <path d="M0-4.6 L1.4-3.2 L3.4-3.6 L2.6-2 L4.6-1.4 L2.8-0.4 L3.6 1.4 L1.8 0.8 L1.6 2.8 L0.6 3.6 L0 5 L-0.6 3.6 L-1.6 2.8 L-1.8 0.8 L-3.6 1.4 L-2.8-0.4 L-4.6-1.4 L-2.6-2 L-3.4-3.6 L-1.4-3.2 Z" />
        <rect x="-3.4" y="3.4" width="6.8" height="1.1" rx="0.4" />
      </g>
    </svg>
  );
}

/** Suez — the official governorate flag (downloaded file). */
export function SuezFlag({ className }: { className?: string }): React.JSX.Element {
  return (
    <Image
      src="/icons/suez.png"
      alt="Suez governorate flag"
      width={36}
      height={24}
      loading="lazy"
      className={cn(flagClass, className)}
    />
  );
}

/** Britain — Union Jack (simplified, for the languages counter). */
export function BritainFlag({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 36 24"
      role="img"
      aria-label="Britain flag"
      className={cn("block h-4 w-6 overflow-hidden rounded-[3px] ring-1 ring-white/25", className)}
    >
      <rect x="0" y="0" width="36" height="24" fill="#012169" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#ffffff" strokeWidth="4.5" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#C8102E" strokeWidth="1.8" />
      <path d="M18 0 V24 M0 12 H36" stroke="#ffffff" strokeWidth="7" />
      <path d="M18 0 V24 M0 12 H36" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

/** France — blue / white / red vertical bands. */
export function FranceFlag({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 36 24"
      role="img"
      aria-label="France flag"
      className={cn("block h-4 w-6 overflow-hidden rounded-[3px] ring-1 ring-white/25", className)}
    >
      <rect x="0" y="0" width="12" height="24" fill="#0055A4" />
      <rect x="12" y="0" width="12" height="24" fill="#ffffff" />
      <rect x="24" y="0" width="12" height="24" fill="#EF4135" />
    </svg>
  );
}

/** Inline location chip: flag + label, used beside Suez / Egypt mentions. */
export function FlagChip({
  flag,
  label,
  title,
}: {
  flag: "eg" | "suez";
  label: string;
  title?: string;
}): React.JSX.Element {
  return (
    <span
      title={title ?? label}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] py-0.5 pr-2.5 pl-1 align-middle"
    >
      {flag === "eg" ? <EgyptFlag /> : <SuezFlag />}
      <span className="text-[11px] font-bold tracking-wide">{label}</span>
    </span>
  );
}
