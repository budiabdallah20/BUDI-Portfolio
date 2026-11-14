"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUDI_MARK_PATH, BUDI_WORDMARK_PATH } from "@/lib/brand";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function LoadingScreen({ onComplete, onExit }: { onComplete: () => void; onExit?: () => void }): React.JSX.Element {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState("awakening");
  const skipRef = useRef<HTMLButtonElement>(null);
  const finish = useCallback(() => {
    if (document.activeElement === skipRef.current) document.getElementById("hero-heading")?.focus({ preventScroll: true });
    onComplete();
    onExit?.();
  }, [onComplete, onExit]);

  useEffect(() => {
    const device = navigator as Navigator & { deviceMemory?: number };
    if (reduced || (device.deviceMemory && device.deviceMemory <= 2)) {
      finish();
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase("seal"), 520),
      window.setTimeout(() => setPhase("doors"), 1400),
      window.setTimeout(() => { setPhase("arrival"); onComplete(); }, 2820),
      window.setTimeout(finish, 3500),
    ];
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
    window.addEventListener("keydown", escape);
    return () => { timers.forEach(timer => window.clearTimeout(timer)); window.removeEventListener("keydown", escape); };
  }, [finish, onComplete, reduced]);

  if (reduced) return <></>;

  return (
    <div
      data-loader-root="site"
      className="egypt-gate flagship-gate" data-act={phase}
      aria-label="BUDI introduction"
      aria-live="polite"
    >
      <div className="museum-gate-depth" aria-hidden="true">
        <svg viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="gate-limestone" x2="1" y2=".8">
              <stop stopColor="#211911"/><stop offset=".38" stopColor="#755638"/><stop offset=".66" stopColor="#422d1d"/><stop offset="1" stopColor="#191411"/>
            </linearGradient>
            <linearGradient id="gate-floor" x2="0" y2="1">
              <stop stopColor="#87603a"/><stop offset="1" stopColor="#1a1410"/>
            </linearGradient>
            <pattern id="gate-masonry" width="142" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 1h142M0 37h142M43 1v36m70 0v35" fill="none" stroke="#17110c" strokeOpacity=".62"/>
            </pattern>
          </defs>
          <path d="M0 720h1000L635 438H365Z" fill="url(#gate-floor)"/>
          <path d="m500 442-354 278m354-278-170 278m170-278v278m0-278 170 278M500 442l354 278M228 554h544M143 623h714" fill="none" stroke="#ca9b64" opacity=".45"/>
          <path d="M86 119h828l57 481H29Zm262 451h304l-24-368H372Z" fill="url(#gate-limestone)" fillRule="evenodd"/>
          <path d="M86 119h828l57 481H29Zm262 451h304l-24-368H372Z" fill="url(#gate-masonry)" fillRule="evenodd"/>
          <path d="M58 116h884l-23 38H81Zm45 45h794l-15 27H118Z" fill="url(#gate-limestone)" stroke="#ac7f49"/>
          <path d="M335 570l26-377h278l26 377m-342 0 25-389h304l25 389" fill="none" stroke="#d6a665" strokeWidth="3"/>
          <path className="egypt-gate-trace" pathLength="1" d="M110 164h780M328 574l25-389h294l25 389" fill="none" stroke="#ffdb94" strokeWidth="2"/>
          <path d="M455 144q45-36 90 0m-69 0 24-19 24 19m-70 0h-36m128 0h36" fill="none" stroke="#d6a665" strokeWidth="2"/>
        </svg>
      </div>
      <div className="flagship-gate-light" aria-hidden="true" />

      {/* Temple gate doors */}
      <div className={`egypt-gate-doors${phase === "doors" || phase === "arrival" ? " is-opening" : ""}`} aria-hidden="true">
        <div className="egypt-door egypt-door-left"><span className="gate-door-inlay" /></div>
        <div className="egypt-door egypt-door-right"><span className="gate-door-inlay" /></div>
        <div className="egypt-door-seam" />
      </div>

      {/* Original BUDI mark, suspended in front of the doors. */}
      <div className="egypt-gate-seal">
        {/* Decorative hieroglyphic line above */}

        {/* BUDI mark */}
        <svg viewBox="0 0 58 84" aria-hidden="true">
          <path d={BUDI_MARK_PATH} fillRule="evenodd" />
        </svg>
        {/* BUDI wordmark */}
        <svg viewBox="0 0 114 72" role="img" aria-label="BUDI">
          <path d={BUDI_WORDMARK_PATH} fillRule="evenodd" />
        </svg>
        {/* Museum label */}
        <p className="egypt-gate-label">Portfolio · Museum</p>
      </div>

      {/* Skip button */}
      <button
        type="button"
        ref={skipRef}
        onClick={finish}
        className="egypt-gate-skip"
      >
        {t.loader.skip} ↗
      </button>
    </div>
  );
}
