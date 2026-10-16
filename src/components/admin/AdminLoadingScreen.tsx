"use client";

import CinematicLoader from "./CinematicLoader";

interface AdminLoadingScreenProps {
  onComplete: () => void;
}

/** Rotating boot status — the "alive" thread, swapped on a live ticker. */
const BOOT_LINES = [
  "Waking secure shell…",
  "Linking Supabase…",
  "Syncing snapshot…",
  "Hydrating widgets…",
  "Opening dashboard…",
] as const;

/**
 * The single dashboard loader — the BUDI console's own cinematic curtain
 * (reference-style: aurora + parallax stars + drawn emblem + per-letter fill
 * wordmark). One loader for the dashboard; the control-center opening splash
 * lives in GlobalSplash.
 *
 * Parent keeps <Dashboard/> mounted below, so data fetching happens live
 * behind the curtain and the lift exposes a ready console.
 */
export default function AdminLoadingScreen({ onComplete }: AdminLoadingScreenProps): React.JSX.Element {
  return (
    <CinematicLoader
      word="Dashboard"
      subtitle="BUDI Portfolio Console"
      label="Loading BUDI dashboard"
      trackLabel="Loading dashboard"
      bootLines={BOOT_LINES}
      accent="#ff6a00"
      accentAlt="#bef264"
      bg="#08080a"
      zClass="z-[200]"
      watchdogMs={5200}
      onComplete={onComplete}
    />
  );
}
