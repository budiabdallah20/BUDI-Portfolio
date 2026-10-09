"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import Logo from "@/components/Logo";
import { profile } from "@/data/portfolio";
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

/** Magic dust rising across the curtain — deterministic (SSR-safe). */
const DUST = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${58 + ((i * 23) % 38)}%`,
  size: 2 + ((i * 7) % 2),
  delay: `${((i * 41) % 24) / 10}s`,
  lime: i % 3 === 0,
}));

/**
 * BUDI preloader — luxury magic edition, black × green (~3.7s):
 *  One giant B draws itself as a hairline stroke at center stage — no
 *  wordmark, the letter is the whole show. Around it: a breathing halo,
 *  twinkling sparks, rising magic dust, a comet riding the orbit ring and
 *  a silk shine passing across. Below: role caps, the hexagonal logo seal,
 *  and the progress numeral resting bottom-right over a full-width hairline
 *  track. Entrance is pure CSS (first paint, zero JS wait); GSAP only
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const q = gsap.utils.selector(root);
    const finish = (): void => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      document.body.style.overflow = prevOverflow;
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

    let ctx: { revert: () => void } | null = null;
    let safety = 0;
    try {
      ctx = gsap.context(() => {
      const progress = { value: 0 };
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
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: (): void => {
              const v = Math.round(progress.value);
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
      document.body.style.overflow = prevOverflow;
    };
  }, [skipIntro]);

  return (
    <div
      ref={rootRef}
      data-loader-root="site"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${profile.name} portfolio`}
      /* Black luxury curtain.
         .loader-failsafe (pure CSS, zero JS): even if every timer and every
         chunk dies after first paint, the curtain self-dismisses. */
      className="loader-failsafe fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030705] text-[#eef4e6]"
    >
      {/* Deep black-green base — black like it always was */}
      <div
        aria-hidden="true"
        className="animate-load-bg absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(150deg, #010402 0%, #04140b 40%, #010402 65%, #061f10 100%)",
        }}
      />
      {/* Breathing magic halo behind the emblem */}
      <div
        aria-hidden="true"
        className="load-magic-halo pointer-events-none absolute top-1/2 left-1/2 h-[72vmin] w-[72vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(215,253,68,0.05) 42%, transparent 65%)",
        }}
      />
      {/* Slow ambient aura drift */}
      <div
        data-load-orb="1"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full will-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(215,253,68,0.06) 0%, transparent 60%)",
        }}
      />
      {/* Faint architectural grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(238,244,230,0.032) 1px, transparent 1px), linear-gradient(to bottom, rgba(238,244,230,0.032) 1px, transparent 1px)",
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
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      {/* Rising magic dust */}
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
              background: d.lime ? "#d7fd44" : "#eaf3df",
              boxShadow: d.lime
                ? "0 0 8px rgba(215,253,68,0.9)"
                : "0 0 7px rgba(234,243,223,0.8)",
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>
      {/* Hairline inset frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[18px] border border-white/[0.08] sm:inset-5 sm:rounded-[22px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#d7fd44]/80 sm:top-5"
        style={{ boxShadow: "0 0 10px rgba(215,253,68,0.7)" }}
      />

      {/* Top hairline bar — mini mark, no wordmark */}
      <div
        data-load-meta
        aria-hidden="true"
        className="load-enter-meta absolute top-0 flex w-full items-center justify-between px-8 pt-7 sm:px-12 sm:pt-9"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 40 40"
          className="block h-[22px] w-[22px] text-[#eaf3df]"
        >
          <polygon
            points="20,4 33.5,11.8 33.5,27.2 20,35 6.5,27.2 6.5,11.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <text
            x="20"
            y="27.5"
            textAnchor="middle"
            fontSize="17"
            fontWeight="800"
            fontFamily="'Space Grotesk', Inter, sans-serif"
            fill="currentColor"
          >
            B
          </text>
          <circle cx="20" cy="4" r="2.6" fill="#d7fd44" />
        </svg>
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#eef4e6]/50 uppercase">
          {t.loader.folio}
        </span>
      </div>

      {/* Brand — the giant drawn B is the whole show */}
      <div data-load-brand className="relative z-10 flex flex-col items-center px-6 text-center">
        <div aria-hidden="true" className="load-enter-mark relative">
          <svg
            width="288"
            height="288"
            viewBox="0 0 200 200"
            className="block h-56 w-56 sm:h-72 sm:w-72"
            style={{ filter: "drop-shadow(0 0 34px rgba(34,197,94,0.32))" }}
          >
            <g data-load-ring>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(238,244,230,0.15)"
                strokeWidth="1"
                strokeDasharray="2 8"
              />
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="rgba(215,253,68,0.22)"
                strokeWidth="1"
              />
              {/* comet riding the orbit */}
              <circle cx="100" cy="10" r="3.5" fill="#d7fd44" opacity="0.95" />
              <circle cx="100" cy="10" r="7" fill="#d7fd44" opacity="0.25" />
            </g>
            {/* B silhouette — draws itself, then breathes emerald */}
            <path
              d="M68 52 H102 C120 52 128 64 128 78 C128 90 120 98 108 100 C122 102 132 112 132 128 C132 146 120 156 100 156 H68 Z"
              fill="transparent"
              stroke="#eaf3df"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              className="load-luxe-b"
            />
            <path
              d="M68 52 V156"
              fill="none"
              stroke="#d7fd44"
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
            <span className="load-luxe-shine absolute inset-y-0 left-0" />
          </div>
          {/* twinkling sparks */}
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
                  background: s.diamond ? "#d7fd44" : "#eaf3df",
                  boxShadow: s.diamond
                    ? "0 0 10px rgba(215,253,68,0.95)"
                    : "0 0 8px rgba(234,243,223,0.9)",
                  animationDelay: s.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hairline divider with diamond */}
        <div aria-hidden="true" className="mt-6 flex items-center gap-3">
          <span className="load-luxe-rule block h-px w-16 origin-right bg-gradient-to-l from-[#d7fd44]/70 to-transparent sm:w-24" />
          <span className="load-luxe-diamond block h-1 w-1 rotate-45 bg-[#d7fd44]" />
          <span className="load-luxe-rule block h-px w-16 origin-left bg-gradient-to-r from-[#d7fd44]/70 to-transparent sm:w-24" />
        </div>

        {/* Role — quiet caps */}
        <p className="load-luxe-sub mt-4 font-mono text-[10px] font-medium tracking-[0.42em] text-[#eef4e6]/55 uppercase sm:text-[11px]">
          {t.loader.role}
        </p>

        {/* Site logo seal — the hexagonal B, revealed after the draw */}
        <div
          aria-hidden="true"
          className="load-luxe-seal mt-7 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#eaf3df] shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        >
          <Logo />
        </div>
      </div>

      {/* Progress — numeral bottom-right, hairline track along the edge */}
      <div
        data-load-meta
        className="load-enter-meta absolute inset-x-0 bottom-0 flex items-end justify-between px-8 pb-7 sm:px-12 sm:pb-9"
      >
        <div className="flex flex-col gap-2 pb-1">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#eef4e6]/55 uppercase">
            {t.loader.loading}
          </span>
          <button
            type="button"
            onClick={skipIntro}
            className="w-fit font-mono text-[10px] tracking-[0.25em] text-[#eef4e6]/40 uppercase underline decoration-[#d7fd44]/40 underline-offset-4 transition-colors hover:text-[#eef4e6]/90"
          >
            {t.loader.skip}
          </button>
        </div>
        <span className="flex items-baseline gap-1.5 font-mono tabular-nums">
          <span
            data-load-pct
            className="display text-5xl leading-none font-light text-[#f2f7ec] sm:text-6xl"
            style={{ textShadow: "0 0 26px rgba(34,197,94,0.4)" }}
          >
            0
          </span>
          <span className="text-xs text-[#eef4e6]/50">%</span>
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.07]">
        <div
          data-load-bar
          className="h-full w-full origin-left bg-gradient-to-r from-[#16a34a] via-[#4ade80] to-[#d7fd44]"
          style={{ transform: "scaleX(0)", boxShadow: "0 0 14px rgba(74,222,128,0.9)" }}
        />
      </div>

      {/* Exit wash */}
      <div
        data-load-wash
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(34,197,94,0.22), transparent 55%), linear-gradient(115deg, rgba(215,253,68,0.1), transparent 70%)",
        }}
      />

      {/* Exit sweep — soft blade */}
      <div
        data-load-sweep
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-35%] left-0 w-[40%] rotate-[-12deg] will-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(238,244,230,0.22), transparent)",
        }}
      />
    </div>
  );
}
