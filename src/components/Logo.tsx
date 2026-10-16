import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "full";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

const GOLD_LIGHT = "#F5E6B8";
const GOLD = "#E9CE7A";
const GOLD_DEEP = "#D4AF37";
const INK = "#0B0B0C";

/**
 * BUDI official identity — black × gold luxury, no slogan.
 *
 * - `mark` (default, 1:1): black tile, gold border, gold B core.
 *   Used in tiny contexts: favicon seal, loader corner, badges, toasts.
 * - `full` (3.2:1): the BUDI wordmark recreated from the reference shot —
 *   gold bar with alternating black panels behind B and D, gold letters
 *   on black and black letters on gold. No slogan line underneath.
 *   Used in navbar, loader center stage and official placements.
 */
export default function Logo({ variant = "mark", className }: LogoProps): React.JSX.Element {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const goldId = `budi-gold-${uid}`;
  const strokeId = `budi-stroke-${uid}`;

  if (variant === "full") {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex items-center", className)}
        style={{ filter: "drop-shadow(0 0 14px rgba(212,175,55,0.35))" }}
      >
        <svg
          viewBox="0 0 360 112"
          role="img"
          aria-label="BUDI logo"
          className="block h-9 w-auto sm:h-10"
        >
          <defs>
            <linearGradient id={goldId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F9EDB0" />
              <stop offset="38%" stopColor={GOLD} />
              <stop offset="72%" stopColor={GOLD_DEEP} />
              <stop offset="100%" stopColor="#F5E08C" />
            </linearGradient>
            <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8A6D1B" />
              <stop offset="50%" stopColor={GOLD} />
              <stop offset="100%" stopColor="#8A6D1B" />
            </linearGradient>
          </defs>
          {/* Gold bar — the canvas of the wordmark */}
          <rect x="4" y="4" width="352" height="104" fill={`url(#${goldId})`} />
          {/* Black architectural panels behind B and D (as in reference) */}
          <rect x="4" y="4" width="86" height="104" fill={INK} />
          <rect x="178" y="4" width="94" height="104" fill={INK} />
          {/* BUDI letters — Space Grotesk 900, tight, centered per panel */}
          <text
            x="47"
            y="80"
            textAnchor="middle"
            fontSize="68"
            fontWeight="900"
            fontFamily="'Space Grotesk', Inter, sans-serif"
            letterSpacing="0"
            fill={GOLD}
          >
            B
          </text>
          <text
            x="134"
            y="80"
            textAnchor="middle"
            fontSize="68"
            fontWeight="900"
            fontFamily="'Space Grotesk', Inter, sans-serif"
            letterSpacing="0"
            fill={INK}
          >
            U
          </text>
          <text
            x="225"
            y="80"
            textAnchor="middle"
            fontSize="68"
            fontWeight="900"
            fontFamily="'Space Grotesk', Inter, sans-serif"
            letterSpacing="0"
            fill={GOLD}
          >
            D
          </text>
          <text
            x="314"
            y="80"
            textAnchor="middle"
            fontSize="68"
            fontWeight="900"
            fontFamily="'Space Grotesk', Inter, sans-serif"
            letterSpacing="0"
            fill={INK}
          >
            I
          </text>
          {/* Thin luxury frame — brighter top, deeper bottom */}
          <rect
            x="2"
            y="2"
            width="356"
            height="108"
            fill="none"
            stroke={`url(#${strokeId})`}
            strokeWidth="3"
          />
          <rect x="4" y="4" width="352" height="2.5" fill={GOLD_LIGHT} opacity="0.55" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={cn("relative flex h-10 w-10 items-center justify-center", className)}
      aria-hidden="true"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        role="img"
        aria-label="BUDI mark"
        className="block h-10 w-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
        style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.4))" }}
      >
        <defs>
          <linearGradient id={goldId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9EDB0" />
            <stop offset="55%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DEEP} />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="9"
          fill={INK}
          stroke={`url(#${goldId})`}
          strokeWidth="2.2"
        />
        <rect x="4.5" y="4.5" width="31" height="2" rx="1" fill={GOLD_LIGHT} opacity="0.35" />
        <text
          x="20"
          y="28.5"
          textAnchor="middle"
          fontSize="21"
          fontWeight="900"
          fontFamily="'Space Grotesk', Inter, sans-serif"
          fill={GOLD}
        >
          B
        </text>
        <circle cx="30.5" cy="9.5" r="2.4" fill={GOLD_DEEP} />
        <circle cx="30.5" cy="9.5" r="1" fill={INK} />
      </svg>
    </span>
  );
}
