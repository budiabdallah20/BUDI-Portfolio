"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import Logo from "@/components/Logo";
import { profile } from "@/data/portfolio";
import { lockBodyScroll } from "@/hooks/useBodyScrollLock";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LoadingScreenProps {
  onComplete: () => void;
}

/** Magic sparks dancing around the emblem — deterministic (SSR-safe). */
const SPARKS = [
  { left: "6%", top: "20%", size: 4, delay: "0.2s", diamond: true },
  { left: "90%", top: "14%", size: 3, delay: "0.7s", diamond: false },
  { left: "95%", top: "56%", size: 5, delay: "1.1s", diamond: true },
  { left: "2%", top: "64%", size: 3, delay: "0.4s", diamond: false },
  { left: "16%", top: "90%", size: 4, delay: "0.9s", diamond: true },
  { left: "80%", top: "92%", size: 3, delay: "1.4s", diamond: false },
  { left: "50%", top: "-3%", size: 4, delay: "0.1s", diamond: true },
  { left: "31%", top: "7%", size: 2.5, delay: "1.7s", diamond: false },
] as const;

/** Gold dust rising across the curtain — deterministic (SSR-safe). */
const DUST = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${58 + ((i * 23) % 38)}%`,
  size: 2 + ((i * 7) % 2),
  delay: `${((i * 41) % 24) / 10}s`,
  bright: i % 3 === 0,
}));

/**
 * BUDI preloader — black × gold official identity (~3.7s):
 *  1) A giant B draws itself as a hairline gold stroke at center stage.
 *  2) The official BUDI wordmark (no slogan) reveals silk-smooth right
 *     after the draw, then breathes with a luxury gold pulse + halo.
 *  3) Bottom progress counts 1 → 100 with a gold hairline track.
 *  Entrance is pure CSS (first paint, zero JS wait); GSAP only
 *  drives the counter and the exit (sweep + wash + lift).
 */
export default function LoadingScreen({ onComplete }: LoadingScreenProps): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const finishedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const { t } = useLanguage();

  /** Skip fast-forwards the show — the curtain lift still plays. */
  const skipIntro = useCallback((): void => {
    const tl = tlRef.current;
    if (tl && tl.progress() < 1) tl.timeScale(4);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Counted lock: if a modal somehow opens during the intro, the last
    // release (not the loader) restores the real page scroll state.
    const releaseScroll = lockBodyScroll();

    const q = gsap.utils.selector(root);
    const finish = (): void => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      releaseScroll();
      doneRef.current();
    };

    // LAYER 1 — independent watchdog: even if the choreography throws,
    // the curtain still lifts.
    const watchdog = window.setTimeout(() => {
      finish();
    }, 4200);

    // Reduced motion: brief static brand, no choreography.
    if (reduced) {
      gsap.set(root, { autoAlpha: 1 });
      const timer = window.setTimeout(finish, 450);
      return (): void => {
        window.clearTimeout(timer);
        window.clearTimeout(watchdog);
        releaseScroll();
      };
    }

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        skipIntro();
      }
    };
    document.addEventListener("keydown", onKey);

    let ctx: { revert: () => void } | null = null;
    let safety = 0;
    try {
      ctx = gsap.context(() => {
      const progress = { value: 1 };
      const bar = q("[data-load-bar]")[0] as HTMLElement | undefined;
      const pct = q("[data-load-pct]")[0] as HTMLElement | undefined;

      // Slow ambient drift + ring rotation — independent, reverted on cleanup.
      gsap.to('[data-load-orb="1"]', {
        x: 50,
        y: -36,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to("[data-load-ring]", {
        rotation: 360,
        duration: 28,
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
            duration: 1.6,
            ease: "power2.inOut",
            onUpdate: (): void => {
              const v = Math.max(1, Math.round(progress.value));
              if (bar) bar.style.transform = `scaleX(${v / 100})`;
              if (pct) pct.textContent = `${v}`;
            },
          },
          0.5,
        )
        // The meta entrances use fill-mode both — release them first so the
        // stylesheet doesn't win over the fade-out. The beat lets the
        // emblem and the logo seal settle before the brand bows out.
        .call(
          (): void => {
            for (const el of q("[data-load-meta]")) {
              (el as HTMLElement).style.animation = "none";
            }
          },
          undefined,
          "+=0.55",
        )
        .fromTo(
          "[data-load-sweep]",
          { xPercent: -160, autoAlpha: 0 },
          { xPercent: 160, autoAlpha: 1, duration: 0.45, ease: "power2.inOut" },
          "+=0.1",
        )
        .to("[data-load-sweep]", { autoAlpha: 0, duration: 0.2 }, "-=0.06")
        .to("[data-load-wash]", { autoAlpha: 1, duration: 0.28 }, "<")
        .to("[data-load-brand]", { autoAlpha: 0, y: -28, duration: 0.35, ease: "power2.in" }, "<")
        .to("[data-load-meta]", { autoAlpha: 0, duration: 0.25 }, "<")
        .to(root, { yPercent: -100, duration: 0.65, ease: "power4.inOut" }, "-=0.05");
    }, root);

      safety = window.setTimeout(() => {
        try {
          const tl = tlRef.current;
          if (tl && tl.progress() < 1) tl.progress(1);
        } catch {
          finish();
        }
      }, 5500);
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
      releaseScroll();
    };
  }, [skipIntro]);

  return (
    <div
      ref={rootRef}
      data-loader-root="site"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${profile.name} portfolio`}
      /* Black-gold luxury curtain.
         .loader-failsafe (pure CSS, zero JS): even if every timer and every
         chunk dies after first paint, the curtain self-dismisses. */
      className="loader-failsafe fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505] text-[#f5eed6]"
    >
      {/* Deep black-gold base */}
      <div
        aria-hidden="true"
        className="animate-load-bg absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(150deg, #050505 0%, #141004 40%, #050505 65%, #1e1605 100%)",
        }}
      />
      {/* Breathing gold halo behind the emblem */}
      <div
        aria-hidden="true"
        className="load-magic-halo pointer-events-none absolute top-1/2 left-1/2 h-[72vmin] w-[72vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(245,230,184,0.06) 42%, transparent 65%)",
        }}
      />
      {/* Slow ambient aura drift */}
      <div
        data-load-orb="1"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 60%)",
        }}
      />
      {/* Faint architectural grid — gold hairlines */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(233,206,122,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(233,206,122,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.78) 100%)",
        }}
      />
      {/* Rising gold dust */}
      <div aria-hidden="true" className="absolute inset-0">
        {DUST.map((d, i) => (
          <span
            key={i}
            className="load-magic-dust absolute rounded-full"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              background: d.bright ? "#e9ce7a" : "#f5e6b8",
              boxShadow: d.bright
                ? "0 0 8px rgba(233,206,122,0.9)"
                : "0 0 7px rgba(245,230,184,0.8)",
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>
      {/* Hairline inset frame — gold */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[18px] border border-[#d4af37]/15 sm:inset-5 sm:rounded-[22px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#e9ce7a]/90 sm:top-5"
        style={{ boxShadow: "0 0 10px rgba(212,175,55,0.7)" }}
      />

      {/* Top hairline bar — official mark, no wordmark */}
      <div
        data-load-meta
        aria-hidden="true"
        className="load-enter-meta absolute top-0 flex w-full items-center justify-between px-8 pt-7 sm:px-12 sm:pt-9"
      >
        <span className="block h-[22px] w-[22px] [&>span]:h-[22px] [&>span]:w-[22px]">
          <Logo variant="mark" className="h-[22px] w-[22px] [&_svg]:h-[22px] [&_svg]:w-[22px]" />
        </span>
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#f5eed6]/50 uppercase">
          {t.loader.folio}
        </span>
      </div>

      {/* Brand — B draws itself, then the official BUDI wordmark breathes */}
      <div data-load-brand className="relative z-10 flex flex-col items-center px-6 text-center">
        <div aria-hidden="true" className="load-enter-mark relative">
          <svg
            width="288"
            height="288"
            viewBox="0 0 200 200"
            className="block h-52 w-52 sm:h-64 sm:w-64"
            style={{ filter: "drop-shadow(0 0 34px rgba(212,175,55,0.35))" }}
          >
            <g data-load-ring>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(245,238,214,0.15)"
                strokeWidth="1"
                strokeDasharray="2 8"
              />
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="rgba(212,175,55,0.28)"
                strokeWidth="1"
              />
              {/* comet riding the orbit */}
              <circle cx="100" cy="10" r="3.5" fill="#e9ce7a" opacity="0.95" />
              <circle cx="100" cy="10" r="7" fill="#e9ce7a" opacity="0.25" />
            </g>
            {/* B silhouette — draws itself, then breathes gold */}
            <path
              d="M68 52 H102 C120 52 128 64 128 78 C128 90 120 98 108 100 C122 102 132 112 132 128 C132 146 120 156 100 156 H68 Z"
              fill="transparent"
              stroke="#f5e6b8"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              className="load-luxe-b load-luxe-b--gold"
            />
            <path
              d="M68 52 V156"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.6"
              strokeLinecap="round"
              pathLength={1}
              className="load-luxe-b-stem"
              opacity="0.9"
            />
          </svg>
          {/* silk shine passing across the emblem */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          >
            <span className="load-luxe-shine load-luxe-shine--gold absolute inset-y-0 left-0" />
          </div>
          {/* twinkling gold sparks */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-6">
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="load-magic-spark absolute"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  borderRadius: s.diamond ? "1px" : "9999px",
                  background: s.diamond ? "#e9ce7a" : "#f5e6b8",
                  boxShadow: s.diamond
                    ? "0 0 10px rgba(233,206,122,0.95)"
                    : "0 0 8px rgba(245,230,184,0.9)",
                  animationDelay: s.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Official BUDI wordmark — reveals after the B draw, then pulses */}
        <div aria-hidden="true" className="load-budi-reveal mt-6 flex justify-center">
          <div className="load-gold-pulse">
            <Logo variant="full" />
          </div>
        </div>

        {/* Hairline divider with diamond */}
        <div aria-hidden="true" className="mt-5 flex items-center gap-3">
          <span className="load-luxe-rule block h-px w-16 origin-right bg-gradient-to-l from-[#d4af37]/80 to-transparent sm:w-24" />
          <span className="load-luxe-diamond block h-1 w-1 rotate-45 bg-[#e9ce7a]" />
          <span className="load-luxe-rule block h-px w-16 origin-left bg-gradient-to-r from-[#d4af37]/80 to-transparent sm:w-24" />
        </div>

        {/* Role — quiet caps */}
        <p className="load-luxe-sub mt-4 font-mono text-[10px] font-medium tracking-[0.42em] text-[#f5eed6]/60 uppercase sm:text-[11px]">
          {t.loader.role}
        </p>
      </div>

      {/* Progress — 1→100 numeral bottom-right, gold hairline track */}
      <div
        data-load-meta
        className="load-enter-meta absolute inset-x-0 bottom-0 flex items-end justify-between px-8 pb-7 sm:px-12 sm:pb-9"
      >
        <div className="flex flex-col gap-2 pb-1">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#f5eed6]/60 uppercase">
            {t.loader.loading}
          </span>
          <button
            type="button"
            onClick={skipIntro}
            className="w-fit font-mono text-[10px] tracking-[0.25em] text-[#f5eed6]/40 uppercase underline decoration-[#d4af37]/50 underline-offset-4 transition-colors hover:text-[#f5eed6]/90"
          >
            {t.loader.skip}
          </button>
        </div>
        <span className="flex items-baseline gap-1.5 font-mono tabular-nums">
          <span
            data-load-pct
            className="display text-5xl leading-none font-light text-[#f7f0d8] sm:text-6xl"
            style={{ textShadow: "0 0 26px rgba(212,175,55,0.45)" }}
          >
            1
          </span>
          <span className="text-xs text-[#f5eed6]/55">%</span>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.07]">
        <div
          data-load-bar
          className="h-full w-full origin-left bg-gradient-to-r from-[#8a6d1b] via-[#d4af37] to-[#f9edb0]"
          style={{ transform: "scaleX(0.01)", boxShadow: "0 0 14px rgba(212,175,55,0.9)" }}
        />
      </div>

      {/* Exit wash — gold */}
      <div
        data-load-wash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.22), transparent 55%), linear-gradient(115deg, rgba(233,206,122,0.12), transparent 70%)",
        }}
      />

      {/* Exit sweep — soft blade */}
      <div
        data-load-sweep
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-35%] left-0 w-[40%] rotate-[-12deg] will-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(245,238,214,0.22), transparent)",
        }}
      />
    </div>
  );
}
