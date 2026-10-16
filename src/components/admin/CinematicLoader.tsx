"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

/**
 * CinematicLoader — the reference-style full-screen curtain, shared by the
 * control-center opening splash and the dashboard loader.
 *
 * Composition (mirrors the reference site's loader idea):
 *   dark base → aurora orbs → twin parallax star layers → faint grid →
 *   breathing glow behind the emblem → drawn "B" emblem with a silk shine →
 *   per-letter wordmark that rises then is painted by a clip-path fill, with
 *   RGB glitch ghosts + strike lines → subtitle → live boot line → progress
 *   counter + hairline track → diagonal light sweep + radial wash on exit.
 *
 * Robustness:
 *  - Entrance is pure CSS (first paint, zero JS wait).
 *  - GSAP only drives the counter + the exit (sweep / wash / curtain lift).
 *  - Three independent safety layers: a JS watchdog, a GSAP safety net and the
 *    pure-CSS `.loader-failsafe` self-dismiss — the curtain always lifts.
 *  - Respects `prefers-reduced-motion` and unmounts its tickers cleanly.
 */

interface CinematicLoaderProps {
  /** Wordmark — rendered letter by letter with the fill sweep. */
  word: string;
  /** Quiet line under the wordmark (e.g. a role or tagline). */
  subtitle?: string;
  /** Screen-reader label for the curtain. */
  label: string;
  /** Bottom-left caption (e.g. "Loading dashboard"). */
  trackLabel?: string;
  /** Optional status chips (control center). */
  chips?: ReactNode;
  /** Optional rotating boot lines — the "alive" thread. */
  bootLines?: readonly string[];
  /** Main accent (fill, bar, glow). */
  accent: string;
  /** Secondary accent (gradient end, secondary orb). */
  accentAlt: string;
  /** Deepest background color. */
  bg: string;
  /** Tailwind z-index class for the curtain. */
  zClass?: string;
  /** Hard cap in ms — the curtain lifts even if the choreography stalls. */
  watchdogMs?: number;
  onComplete: () => void;
}

/** Small deterministic PRNG (mulberry32) — SSR-safe star scatter. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A tiled star field as stacked radial-gradients (deterministic per seed). */
function starTile(count: number, size: number, seed: number, alpha: number): string {
  const rand = mulberry32(seed);
  const dots: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(rand() * size);
    const y = Math.round(rand() * size);
    const r = (0.5 + rand() * 1.3).toFixed(1);
    dots.push(
      `radial-gradient(${r}px ${r}px at ${x}px ${y}px, rgba(255,255,255,${alpha}), transparent)`,
    );
  }
  return dots.join(",");
}

const STARS_1 = { image: starTile(42, 260, 7, 0.85), size: 260 };
const STARS_2 = { image: starTile(60, 380, 42, 0.5), size: 380 };

export default function CinematicLoader({
  word,
  subtitle,
  label,
  trackLabel,
  chips,
  bootLines,
  accent,
  accentAlt,
  bg,
  zClass = "z-[200]",
  watchdogMs = 5200,
  onComplete,
}: CinematicLoaderProps): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const finishedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lines = bootLines ?? [];
  const [lineIndex, setLineIndex] = useState(0);

  /** Skip fast-forwards the show — the curtain lift still plays. */
  const skipIntro = useCallback((): void => {
    const tl = tlRef.current;
    if (tl && tl.progress() < 1) tl.timeScale(4);
  }, []);

  /* Live ticker — rotates the boot line so the curtain feels alive. */
  useEffect(() => {
    if (lines.length === 0) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % lines.length;
      setLineIndex(i);
    }, 420);
    return (): void => {
      window.clearInterval(id);
    };
    // lines is a stable constant per usage — intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const q = gsap.utils.selector(root);
    const finish = (): void => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      document.body.style.overflow = prevOverflow;
      doneRef.current();
    };

    // LAYER 1 — independent watchdog: even if the choreography throws, the
    // curtain still lifts.
    const watchdog = window.setTimeout(finish, watchdogMs);

    // Reduced motion: brief static brand, no choreography.
    if (reduced) {
      gsap.set(root, { autoAlpha: 1 });
      const timer = window.setTimeout(finish, 450);
      return (): void => {
        window.clearTimeout(timer);
        window.clearTimeout(watchdog);
        document.body.style.overflow = prevOverflow;
      };
    }

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        skipIntro();
      }
    };
    document.addEventListener("keydown", onKey);

    // LAYER 2 — the cinematic choreography, fully guarded.
    let ctx: { revert: () => void } | null = null;
    let safety = 0;
    try {
      ctx = gsap.context(() => {
        const progress = { value: 0 };
        const bar = q("[data-cl-bar]")[0] as HTMLElement | undefined;
        const pct = q("[data-cl-pct]")[0] as HTMLElement | undefined;

        // Slow ambient drift + ring rotation — independent, reverted on cleanup.
        gsap.to('[data-cl-orb="1"]', {
          x: 60,
          y: -44,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to('[data-cl-orb="2"]', {
          x: -70,
          y: 52,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to("[data-cl-ring]", {
          rotation: 360,
          duration: 30,
          repeat: -1,
          ease: "none",
          transformOrigin: "center",
        });

        const tl = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: finish,
        });
        tlRef.current = tl;

        // Entrance is pure CSS — GSAP only drives the counter and the exit.
        tl.to(
          progress,
          {
            value: 100,
            duration: 1.7,
            ease: "power2.inOut",
            onUpdate: (): void => {
              const v = Math.round(progress.value);
              if (bar) bar.style.transform = `scaleX(${v / 100})`;
              if (pct) pct.textContent = `${v}`;
            },
          },
          0.5,
        )
          .to(
            progress,
            {
              value: 100,
              duration: 0.5,
              onUpdate: (): void => {
                if (bar) bar.style.transform = "scaleX(1)";
                if (pct) pct.textContent = "100";
              },
            },
            "+=0.3",
          )
          // Release the CSS meta entrances before fading them out.
          .call(
            (): void => {
              for (const el of q("[data-cl-meta]")) {
                (el as HTMLElement).style.animation = "none";
              }
            },
            undefined,
            "+=0.2",
          )
          .fromTo(
            "[data-cl-sweep]",
            { xPercent: -160, autoAlpha: 0 },
            { xPercent: 160, autoAlpha: 1, duration: 0.45, ease: "power2.inOut" },
            "+=0.05",
          )
          .to("[data-cl-sweep]", { autoAlpha: 0, duration: 0.2 }, "-=0.06")
          .to("[data-cl-wash]", { autoAlpha: 1, duration: 0.28 }, "<")
          .to("[data-cl-brand]", { autoAlpha: 0, y: -28, duration: 0.35, ease: "power2.in" }, "<")
          .to("[data-cl-meta]", { autoAlpha: 0, duration: 0.25 }, "<")
          .to(root, { yPercent: -100, duration: 0.65, ease: "power4.inOut" }, "-=0.05");
      }, root);

      // LAYER 3 — GSAP-level safety net for stalled timelines.
      safety = window.setTimeout(() => {
        try {
          const tl = tlRef.current;
          if (tl && tl.progress() < 1) tl.progress(1);
        } catch {
          finish();
        }
      }, watchdogMs + 1200);
    } catch {
      finish();
    }

    return (): void => {
      window.clearTimeout(safety);
      window.clearTimeout(watchdog);
      document.removeEventListener("keydown", onKey);
      tlRef.current = null;
      try {
        ctx?.revert();
      } catch {
        /* already torn down */
      }
      document.body.style.overflow = prevOverflow;
    };
  }, [skipIntro, watchdogMs]);

  const letters = (word.trim() === "" ? "BUDI" : word.trim().toUpperCase()).split("");
  const liveLine = lines.length > 0 ? (lines[lineIndex] ?? lines[0]) : null;

  return (
    <div
      ref={rootRef}
      data-loader-root="cinematic"
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`loader-failsafe fixed inset-0 ${zClass} flex items-center justify-center overflow-hidden`}
      style={{ backgroundColor: bg, color: "#f4f4ef" }}
    >
      {/* Deep roaming base */}
      <div
        aria-hidden="true"
        className="animate-load-bg absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(150deg, ${bg} 0%, ${accent}14 38%, ${bg} 62%, ${accentAlt}0f 100%)`,
        }}
      />
      {/* Aurora orbs — drifting color */}
      <div
        data-cl-orb="1"
        aria-hidden="true"
        className="pointer-events-none absolute -top-[14%] -left-[10%] h-[56vmax] w-[56vmax] rounded-full will-transform"
        style={{ background: `radial-gradient(circle, ${accent}33 0%, transparent 62%)` }}
      />
      <div
        data-cl-orb="2"
        aria-hidden="true"
        className="pointer-events-none absolute -right-[12%] -bottom-[16%] h-[52vmax] w-[52vmax] rounded-full will-transform"
        style={{ background: `radial-gradient(circle, ${accentAlt}26 0%, transparent 62%)` }}
      />
      <div
        aria-hidden="true"
        className="animate-aurora-c pointer-events-none absolute top-[28%] left-[56%] h-[32vmax] w-[32vmax] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 62%)" }}
      />
      {/* Twin parallax star layers — depth */}
      <div
        aria-hidden="true"
        className="cl-stars-a pointer-events-none absolute -inset-[25%] opacity-70 will-transform"
        style={{ backgroundImage: STARS_1.image, backgroundSize: `${STARS_1.size}px ${STARS_1.size}px` }}
      />
      <div
        aria-hidden="true"
        className="cl-stars-b pointer-events-none absolute -inset-[25%] opacity-50 will-transform"
        style={{ backgroundImage: STARS_2.image, backgroundSize: `${STARS_2.size}px ${STARS_2.size}px` }}
      />
      {/* Faint architectural grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(244,244,239,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,244,239,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 65% at 50% 44%, black 22%, transparent 76%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 65% at 50% 44%, black 22%, transparent 76%)",
        }}
      />
      {/* Vignette for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 92% 92% at 50% 50%, transparent 52%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* Top meta — brand mark + caption */}
      <div
        data-cl-meta
        aria-hidden="true"
        className="load-enter-meta absolute top-0 flex w-full items-center justify-between px-6 pt-6 font-mono text-[11px] tracking-[0.25em] text-white/50 uppercase sm:px-10 sm:pt-8"
      >
        <span>BUDI&reg; Admin</span>
        <span className="flex items-center gap-1.5" style={{ color: accent }}>
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping-soft absolute inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: accent }}
            />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
          </span>
          Secure shell
        </span>
      </div>

      {/* Brand — emblem, wordmark, subtitle */}
      <div data-cl-brand className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <div aria-hidden="true" className="cl-logo-drop relative">
          {/* Breathing glow behind the emblem */}
          <div
            aria-hidden="true"
            className="cl-glow pointer-events-none absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
            style={{ backgroundColor: `${accent}33` }}
          />
          <span className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <span
              aria-hidden="true"
              className="animate-spin-conic absolute -inset-3 rounded-full opacity-70"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${accent} 22%, ${accentAlt} 38%, transparent 55%, transparent 72%, ${accent} 88%, transparent 100%)`,
                filter: "blur(10px)",
              }}
            />
            <svg
              width="192"
              height="192"
              viewBox="0 0 200 200"
              className="relative block h-36 w-36 sm:h-44 sm:w-44"
              style={{ filter: `drop-shadow(0 0 34px ${accent}55)` }}
            >
              <g data-cl-ring>
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(244,244,239,0.16)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                />
                <circle cx="100" cy="100" r="72" fill="none" stroke={`${accent}44`} strokeWidth="1" />
                <circle cx="100" cy="10" r="3.5" fill={accent} opacity="0.95" />
                <circle cx="100" cy="10" r="7" fill={accent} opacity="0.25" />
                <circle cx="28" cy="100" r="2.5" fill={accentAlt} opacity="0.9" />
                <circle cx="28" cy="100" r="5" fill={accentAlt} opacity="0.2" />
              </g>
              <path
                d="M68 52 H102 C120 52 128 64 128 78 C128 90 120 98 108 100 C122 102 132 112 132 128 C132 146 120 156 100 156 H68 Z"
                fill="transparent"
                stroke="#f4f4ef"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                className="load-luxe-b"
              />
              <path
                d="M68 52 V156"
                fill="none"
                stroke={accent}
                strokeWidth="1.6"
                strokeLinecap="round"
                pathLength={1}
                className="load-luxe-b-stem"
                opacity="0.9"
              />
            </svg>
            {/* silk shine crossing the emblem */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            >
              <span className="load-luxe-shine absolute inset-y-0 left-0" />
            </span>
          </span>
        </div>

        {/* Wordmark — per-letter rise + clip-path fill, with glitch ghosts */}
        <div className="relative mt-6 inline-flex [perspective:2000px]">
          <span
            aria-hidden="true"
            className="load-glitch-r pointer-events-none absolute inset-0 z-20 flex justify-center text-[clamp(2.4rem,10vw,6rem)] leading-none font-black tracking-[0.08em] text-red-500 uppercase mix-blend-screen"
          >
            {word.toUpperCase()}
          </span>
          <span
            aria-hidden="true"
            className="load-glitch-c pointer-events-none absolute inset-0 z-20 flex justify-center text-[clamp(2.4rem,10vw,6rem)] leading-none font-black tracking-[0.08em] text-cyan-400 uppercase mix-blend-screen"
          >
            {word.toUpperCase()}
          </span>
          <span
            aria-hidden="true"
            className="load-gline pointer-events-none absolute top-[38%] left-0 z-30 h-[2px] w-full"
            style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <span
            aria-hidden="true"
            className="load-gline pointer-events-none absolute top-[58%] left-0 z-30 h-[2px] w-full bg-white/60"
            style={{ boxShadow: "0 0 10px rgba(34,211,238,0.55)" }}
          />
          <h1 className="load-jitter flex text-[clamp(2.4rem,10vw,6rem)] leading-none font-black tracking-[0.08em] uppercase">
            {letters.map((letter, i) => (
              <span key={i} className="relative inline-block">
                <span
                  className="cl-letter-in block"
                  style={{ animationDelay: `${0.35 + i * 0.05}s` }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </span>
                <span
                  aria-hidden="true"
                  className="load-fill-up absolute inset-0 block"
                  style={{ animationDelay: `${0.8 + i * 0.035}s`, color: accent }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </span>
              </span>
            ))}
          </h1>
        </div>

        {subtitle !== undefined && subtitle.trim() !== "" && (
          <p
            aria-hidden="true"
            className="load-luxe-sub mt-3 font-mono text-[10px] tracking-[0.34em] text-white/45 uppercase sm:text-xs"
          >
            {subtitle}
          </p>
        )}

        {/* Hairline divider with diamond */}
        <div aria-hidden="true" className="mt-5 flex items-center gap-3">
          <span
            className="load-luxe-rule block h-px w-14 origin-right sm:w-20"
            style={{ background: `linear-gradient(to left, ${accent}cc, transparent)` }}
          />
          <span className="load-luxe-diamond block h-1 w-1 rotate-45" style={{ backgroundColor: accent }} />
          <span
            className="load-luxe-rule block h-px w-14 origin-left sm:w-20"
            style={{ background: `linear-gradient(to right, ${accent}cc, transparent)` }}
          />
        </div>

        {liveLine !== null && (
          <p
            aria-hidden="true"
            className="load-luxe-sub mt-4 flex h-5 items-center gap-1 font-mono text-xs font-medium uppercase sm:text-sm"
            style={{ color: accent }}
          >
            <span className="text-white/35">&gt;_</span> {liveLine}
            <span aria-hidden="true" className="animate-load-blink font-bold">
              |
            </span>
          </p>
        )}

        {chips !== undefined && (
          <div className="load-luxe-sub mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-[9px] tracking-[0.22em] uppercase">
            {chips}
          </div>
        )}
      </div>

      {/* Progress — caption + skip bottom-left, numeral bottom-right, track */}
      <div
        data-cl-meta
        className="load-enter-meta absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-6 sm:px-10 sm:pb-8"
      >
        <div className="flex flex-col gap-2 pb-1">
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/55 uppercase">
            {trackLabel ?? label}
          </span>
          <button
            type="button"
            onClick={skipIntro}
            className="w-fit cursor-pointer font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/90"
          >
            Skip
          </button>
        </div>
        <span className="flex items-baseline gap-1.5 font-mono tabular-nums">
          <span
            data-cl-pct
            className="display text-5xl leading-none font-light text-white sm:text-6xl"
            style={{ textShadow: `0 0 26px ${accent}66` }}
          >
            0
          </span>
          <span className="text-xs text-white/50">%</span>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.07]">
        <div
          data-cl-bar
          className="h-full w-full origin-left"
          style={{
            background: `linear-gradient(to right, ${accent}, ${accentAlt})`,
            transform: "scaleX(0)",
            boxShadow: `0 0 14px ${accent}cc`,
          }}
        />
      </div>

      {/* Exit wash */}
      <div
        data-cl-wash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accent}38, transparent 55%), linear-gradient(115deg, ${accentAlt}1a, transparent 70%)`,
        }}
      />

      {/* Exit sweep — soft blade */}
      <div
        data-cl-sweep
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-35%] left-0 w-[42%] rotate-[-12deg] will-transform"
        style={{ background: "linear-gradient(90deg, transparent, rgba(244,244,239,0.22), transparent)" }}
      />
    </div>
  );
}
