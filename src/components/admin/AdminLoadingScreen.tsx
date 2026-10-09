"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Check } from "lucide-react";
import Logo from "@/components/Logo";

interface AdminLoadingScreenProps {
  onComplete: () => void;
  /** Per-workspace wordmark — defaults to DASHBOARD (BUDI Portfolio). */
  word?: string;
  /** Small line under the wordmark (e.g. workspace tagline). */
  subtitle?: string;
}

const WORD = "DASHBOARD";

/** Rotating boot status — the "alive" thread, swapped on a live ticker. */
const BOOT_LINES = [
  "Waking secure shell…",
  "Linking Supabase…",
  "Syncing snapshot…",
  "Hydrating widgets…",
  "Opening dashboard…",
] as const;

/** Boot feed — mimics a real dashboard boot sequence, revealed line by line. */
const FEED = [
  "Session verified",
  "Cloud snapshot synced",
  "Widgets hydrated",
  "Realtime channel open",
] as const;

/** Floating dust — deterministic scatter (SSR-safe), pure CSS float. */
const DUST = [
  { l: "10%", t: "24%", d: "0s", s: "6px" },
  { l: "84%", t: "16%", d: "1.2s", s: "5px" },
  { l: "70%", t: "74%", d: "0.6s", s: "7px" },
  { l: "26%", t: "80%", d: "2s", s: "4px" },
  { l: "46%", t: "10%", d: "1.7s", s: "5px" },
  { l: "92%", t: "52%", d: "2.6s", s: "4px" },
] as const;

/**
 * Admin preloader — three-act cinematic ending in a DOUBLE curtain slide:
 *  1. the real BUDI site mark drops in with an elastic pop inside a spinning
 *     conic ring + orbit sparks, then breathes (levitates) with a pulsing
 *     ember glow while the show runs,
 *  2. the DASHBOARD wordmark slides up letter by letter through a clip mask
 *     (the reference-site signature) while a live boot log feeds in,
 *  3. the counter runs 0 → 100, a light sweep crosses, then the dark curtain
 *     lifts and an ember under-curtain chases it — a sliding wipe that
 *     reveals the already-mounted dashboard underneath, seamlessly.
 * Parent keeps <Dashboard/> mounted below so data fetching happens live
 * behind the curtain and the lift exposes a ready console.
 */
export default function AdminLoadingScreen({ onComplete, word, subtitle }: AdminLoadingScreenProps): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const emberRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const finishedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [line, setLine] = useState<string>(BOOT_LINES[0]);
  const [latency, setLatency] = useState<number>(24);

  /** Skip fast-forwards the show — the double curtain slide still plays. */
  const skipIntro = useCallback((): void => {
    const tl = tlRef.current;
    if (tl && tl.progress() < 1) tl.timeScale(3);
  }, []);

  /* Live ticker — rotates the boot line + jitters the edge latency so the
     curtain feels alive. Independent interval, torn down on unmount. */
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLine(BOOT_LINES[i % BOOT_LINES.length] ?? BOOT_LINES[0]);
      setLatency(16 + Math.floor(Math.random() * 32));
    }, 420);
    return (): void => {
      window.clearInterval(id);
    };
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

    // LAYER 1 — independent watchdog, zero GSAP dependency: even if the
    // choreography throws (stale chunk, throttled rAF), the curtain lifts.
    const watchdog = window.setTimeout(() => {
      finish();
    }, 5000);

    // Reduced motion: brief static brand, no choreography.
    if (reduced) {
      gsap.set(root, { autoAlpha: 1 });
      const ember = emberRef.current;
      if (ember) gsap.set(ember, { autoAlpha: 1 });
      const timer = window.setTimeout(finish, 450);
      return (): void => {
        window.clearTimeout(timer);
        window.clearTimeout(watchdog);
        document.body.style.overflow = prevOverflow;
      };
    }

    // Skip: fast-forward on Escape / Space / Enter / click.
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
        const bar = q("[data-ad-bar]")[0] as HTMLElement | undefined;
        const pct = q("[data-ad-pct]")[0] as HTMLElement | undefined;

        // Ambient orb drift — independent infinite tweens, reverted on cleanup.
        gsap.to('[data-ad-orb="1"]', {
          x: 70,
          y: -50,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to('[data-ad-orb="2"]', {
          x: -60,
          y: 60,
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to('[data-ad-orb="3"]', {
          x: 40,
          y: 50,
          duration: 11,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // Cinematic life — the site mark levitates while its ember glow
        // breathes (transform + opacity only, reverted on cleanup).
        gsap.to("[data-ad-mark]", {
          y: -10,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.7,
        });
        gsap.to("[data-ad-glow]", {
          opacity: 0.3,
          scale: 1.18,
          duration: 1.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const tl = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: finish,
        });
        tlRef.current = tl;

        // Act 1 — the site mark drops in with an elastic pop.
        tl.fromTo(
          "[data-ad-mark]",
          { autoAlpha: 0, scale: 0.55 },
          { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" },
          0,
        )
          // Act 2 — wordmark slides up letter by letter through the mask.
          .fromTo(
            "[data-ad-letter]",
            { yPercent: 118 },
            { yPercent: 0, duration: 0.5, stagger: 0.055 },
            0.35,
          )
          // Act 3 — live boot line + feed settle while the counter runs.
          .fromTo(
            "[data-ad-sub]",
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.4 },
            0.85,
          )
          .fromTo(
            "[data-ad-feed]",
            { autoAlpha: 0, x: -14 },
            { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.09 },
            0.95,
          )
          .fromTo("[data-ad-meta]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.9)
          .to(
            progress,
            {
              value: 100,
              duration: 1.4,
              ease: "power2.inOut",
              onUpdate: (): void => {
                const v = Math.round(progress.value);
                if (bar) bar.style.transform = `scaleX(${v / 100})`;
                if (pct) pct.textContent = `${v}`;
              },
            },
            0.3,
          )
          // Diagonal light sweep across the curtain.
          .fromTo(
            "[data-ad-sweep]",
            { xPercent: -160, autoAlpha: 0 },
            { xPercent: 160, autoAlpha: 1, duration: 0.5, ease: "power2.inOut" },
            "+=0.1",
          )
          .to("[data-ad-sweep]", { autoAlpha: 0, duration: 0.2 }, "-=0.08")
          .to("[data-ad-brand]", { autoAlpha: 0, y: -30, duration: 0.32, ease: "power2.in" }, "<")
          .to("[data-ad-meta]", { autoAlpha: 0, duration: 0.25 }, "<")
          // Double curtain slide — dark veil lifts, ember veil chases it.
          .to(root, { yPercent: -100, duration: 0.7, ease: "power4.inOut" }, "-=0.05");

        const ember = emberRef.current;
        if (ember) {
          tl.to(ember, { yPercent: -100, duration: 0.7, ease: "power4.inOut" }, "-=0.6");
        }
      }, root);

      // LAYER 3 — GSAP-level safety net for stalled timelines.
      safety = window.setTimeout(() => {
        try {
          const tl = tlRef.current;
          if (tl && tl.progress() < 1) tl.progress(1);
        } catch {
          finish();
        }
      }, 6500);
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
  }, [skipIntro]);

  const letters = (word && word.trim() !== "" ? word.trim().toUpperCase().slice(0, 18) : WORD).split("");

  return (
    <>
      {/* Ember under-curtain — chases the dark veil for the sliding wipe. */}
      <div
        ref={emberRef}
        aria-hidden="true"
        className="loader-failsafe fixed inset-0 z-[199] bg-gradient-to-br from-[#ff3d00] via-[#7a2400] to-[#bef264]"
      />
      <div
        ref={rootRef}
        data-loader-root="admin"
        role="status"
        aria-live="polite"
        aria-label="Loading admin dashboard"
        onClick={skipIntro}
        /* Console-dark curtain — same identity as the dashboard it reveals.
           .loader-failsafe (pure CSS, zero JS): even if every timer and every
           chunk dies after first paint, the curtain self-dismisses. */
        className="loader-failsafe fixed inset-0 z-[200] flex cursor-pointer items-center justify-center overflow-hidden bg-[#0a0a0b] text-white"
      >
        {/* Roaming console gradient base */}
        <div
          aria-hidden="true"
          className="animate-load-bg absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(125deg, #0a0a0b 0%, #1c0e04 38%, #101a06 62%, #0a0a0b 100%)",
          }}
        />
        {/* Drifting ember + lime + violet orbs — transform-only motion */}
        <div
          data-ad-orb="1"
          aria-hidden="true"
          className="pointer-events-none absolute -top-[15%] -left-[10%] h-[55vmax] w-[55vmax] rounded-full will-transform"
          style={{
            background:
              "radial-gradient(circle, rgba(255,61,0,0.22) 0%, transparent 62%)",
          }}
        />
        <div
          data-ad-orb="2"
          aria-hidden="true"
          className="pointer-events-none absolute -right-[12%] -bottom-[18%] h-[50vmax] w-[50vmax] rounded-full will-transform"
          style={{
            background:
              "radial-gradient(circle, rgba(190,242,100,0.1) 0%, transparent 62%)",
          }}
        />
        <div
          data-ad-orb="3"
          aria-hidden="true"
          className="pointer-events-none absolute top-[30%] left-[55%] h-[30vmax] w-[30vmax] rounded-full will-transform"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 62%)",
          }}
        />
        {/* Ember core glow behind the wordmark */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(255,61,0,0.16), transparent 65%)",
          }}
        />
        {/* Backdrop grid — masked, CSS only */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(244,244,239,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,244,239,0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 85% 70% at 50% 40%, black 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 70% at 50% 40%, black 30%, transparent 78%)",
          }}
        />
        {/* Floating dust */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {DUST.map((p, i) => (
            <span
              key={i}
              className="animate-float-slow absolute rounded-full bg-[#bef264]/60"
              style={{
                left: p.l,
                top: p.t,
                width: p.s,
                height: p.s,
                animationDelay: p.d,
                boxShadow: "0 0 12px rgba(190,242,100,0.8)",
              }}
            />
          ))}
        </div>
        {/* Dark vignette edges for depth */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 95% 95% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Corner marks */}
        <div
          data-ad-meta
          aria-hidden="true"
          className="absolute top-0 flex w-full items-center justify-between px-6 pt-6 font-mono text-[11px] tracking-[0.25em] text-white/50 uppercase sm:px-10 sm:pt-8"
        >
          <span>BUDI&reg; Admin</span>
          <span className="flex items-center gap-1.5 text-[#bef264]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-[#bef264]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#bef264]" />
            </span>
            Secure shell
          </span>
        </div>

        <div data-ad-brand className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center">
          {/* Act 1 — the real site mark in a spinning conic ring + orbit sparks */}
          <div data-ad-mark aria-hidden="true" className="relative">
            <span aria-hidden="true" className="animate-orbit absolute -inset-3">
              <span className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#bef264] shadow-[0_0_14px_rgba(190,242,100,0.9)]" />
            </span>
            <span aria-hidden="true" className="animate-orbit-rev absolute -inset-6">
              <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#ff3d00] shadow-[0_0_12px_rgba(255,61,0,0.9)]" />
            </span>
            <span className="relative flex h-28 w-28 items-center justify-center">
              <span
                aria-hidden="true"
                className="animate-spin-conic absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, #ff3d00, #bef264, #22d3ee, #8b5cf6, #ff3d00)",
                  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "3px",
                  filter: "drop-shadow(0 0 14px rgba(255,61,0,0.55))",
                }}
              />
              <span
                data-ad-glow
                aria-hidden="true"
                className="absolute inset-3 rounded-full bg-[#ff3d00]/35 blur-2xl"
              />
              <span className="relative scale-[2.2] text-white">
                <Logo />
              </span>
            </span>
          </div>

          {/* Act 2 — sliding wordmark (clip-mask reveal, reference signature) */}
          <p className="sr-only">Dashboard</p>
          <div className="mt-4 overflow-hidden" aria-hidden="true">
            <div
              className="load-shimmer display flex text-[clamp(2.4rem,10vw,6rem)] leading-none font-black tracking-[0.06em] uppercase"
              style={{ filter: "drop-shadow(0 0 26px rgba(255,61,0,0.35))" }}
            >
              {letters.map((letter, i) => (
                <span key={i} data-ad-letter className="inline-block will-transform">
                  {letter === " " ? " " : letter}
                </span>
              ))}
            </div>
          </div>
          {subtitle && subtitle.trim() !== "" && (
            <p aria-hidden="true" className="mt-2 font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
              {subtitle.slice(0, 80)}
            </p>
          )}

          {/* Act 3 — live boot line with blinking cursor */}
          <p
            data-ad-sub
            aria-hidden="true"
            className="mt-4 flex h-5 items-center gap-1 font-mono text-xs font-medium text-[#bef264]/90 uppercase sm:text-sm"
          >
            <span className="text-white/35">&gt;_</span> {line}
            <span aria-hidden="true" className="animate-load-blink font-bold text-[#ff3d00]">
              |
            </span>
          </p>

          {/* Boot feed — terminal-style, revealed line by line */}
          <div aria-hidden="true" className="mt-5 grid w-full max-w-sm gap-1.5 text-left">
            {FEED.map((item, i) => (
              <div
                key={item}
                data-ad-feed
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#bef264]/15">
                  <Check className="h-3 w-3 text-[#bef264]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] tracking-[0.08em] text-white/70">
                  {item}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/25 uppercase tabular-nums">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live edge ticker + counter + progress */}
        <div
          data-ad-meta
          className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-6 pb-6 text-white/80 sm:px-10 sm:pb-8"
        >
          <span className="flex flex-col gap-1.5 font-mono text-[11px] tracking-[0.25em] uppercase">
            <span>Loading dashboard</span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#bef264]/80 tabular-nums">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-[#bef264]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#bef264]" />
              </span>
              edge · {latency}ms · live
            </span>
          </span>
          <button
            type="button"
            onClick={skipIntro}
            className="font-mono text-[11px] tracking-[0.25em] text-white/50 uppercase underline decoration-[#ff3d00]/60 underline-offset-4 transition-colors hover:text-white"
          >
            Skip
          </button>
          <span className="flex items-baseline gap-1 font-mono tabular-nums">
            <span
              data-ad-pct
              className="display text-6xl font-bold text-white sm:text-7xl"
              style={{ filter: "drop-shadow(0 0 18px rgba(255,61,0,0.55))" }}
            >
              0
            </span>
            <span className="text-sm">%</span>
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
          <div
            data-ad-bar
            className="h-full w-full origin-left bg-gradient-to-r from-[#ff3d00] via-[#bef264] to-[#22d3ee]"
            style={{ transform: "scaleX(0)", boxShadow: "0 0 16px rgba(255,61,0,0.8)" }}
          />
        </div>

        {/* Diagonal light sweep */}
        <div
          data-ad-sweep
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[-35%] left-0 w-[45%] rotate-[-12deg] will-transform"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(244,244,239,0.22), transparent)",
          }}
        />
      </div>
    </>
  );
}
