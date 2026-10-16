"use client";

import CinematicLoader from "./CinematicLoader";

interface GlobalSplashProps {
  /** Dashboards in the registry — shown as a status chip. */
  workspaces: number;
  onComplete: () => void;
}

/** Rotating boot status — the "alive" thread, swapped on a live ticker. */
const BOOT_LINES = [
  "Waking secure shell…",
  "Linking dashboards…",
  "Syncing registry…",
  "Opening control center…",
] as const;

/**
 * Control-center opening splash — the FIRST thing on /admin. Same
 * reference-style cinematic language as the dashboard loader (aurora +
 * parallax stars + drawn emblem + per-letter fill wordmark), but in the BUDI
 * OS black × lime identity and worded for the control center itself.
 */
export default function GlobalSplash({ workspaces, onComplete }: GlobalSplashProps): React.JSX.Element {
  return (
    <CinematicLoader
      word="Control Center"
      subtitle="BUDI OS · Mission Control"
      label="Opening control center"
      trackLabel="Opening control center"
      bootLines={BOOT_LINES}
      accent="#d7fd44"
      accentAlt="#4ade80"
      bg="#030705"
      zClass="z-[130]"
      watchdogMs={4800}
      chips={
        <>
          <span
            className="rounded-full border px-3 py-1 tabular-nums"
            style={{ borderColor: "#d7fd4466", backgroundColor: "#d7fd441a", color: "#d7fd44" }}
          >
            {workspaces} {workspaces === 1 ? "dashboard" : "dashboards"}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-white/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Secure shell
          </span>
        </>
      }
      onComplete={onComplete}
    />
  );
}
