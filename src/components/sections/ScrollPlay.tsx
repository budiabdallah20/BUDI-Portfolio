"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  Expand,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import { stackChips } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const LANG_COUNT = 3; // mirrors the "3 Languages" About card
/** One full slide breath before auto-advancing — slow enough to read. */
const AUTOPLAY_MS = 6500;

/** Signature glow per slide — kicker pills, top beams, dots, progress. */
const CHAPTER_COLORS = [
  "#d7fd44",
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
  "#ff3d00",
] as const;

/** Slide flight — whisper dissolve with a directional nudge.
 *  mode="wait" (never two giants animating at once), exit twice as fast
 *  as enter, everything compositor-only. Zero layout reads, zero jank. */
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 48 : -48, opacity: 0, scale: 0.99 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir >= 0 ? -48 : 48,
    opacity: 0,
    scale: 0.99,
    transition: { duration: 0.2, ease: "easeIn" as const },
  }),
};

/** Per-slide side visual — pure CSS/SVG, zero images, all GPU-cheap loops. */
function ChapterVisual({ index }: { index: number }): React.JSX.Element | null {
  if (index === 0) {
    // The mark, alive — twin orbits + breathing core + signal node.
    return (
      <div className="relative flex h-60 w-60 items-center justify-center" aria-hidden="true">
        <span className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-accent/50" />
        <span className="absolute inset-5 rounded-full border border-border" />
        <span
          className="animate-spin-slow absolute inset-10 rounded-full border-t border-accent/70"
          style={{ animationDirection: "reverse", animationDuration: "9s" }}
        />
        <span
          className="display relative text-6xl font-bold text-foreground"
          style={{ filter: "drop-shadow(0 0 22px rgba(215,253,68,0.4))" }}
        >
          B/
        </span>
        <span className="animate-ping-soft absolute top-3 left-1/2 h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(215,253,68,0.9)]" />
        <span className="absolute right-4 bottom-6 h-1.5 w-1.5 rounded-full bg-accent/80" />
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.4em] text-faint">
          EST · MMXXVI
        </span>
      </div>
    );
  }
  if (index === 1) {
    // Browser that builds itself — shimmer hero + blinking caret.
    return (
      <div
        aria-hidden="true"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface/80"
      >
        <span className="animate-glare pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-white/[0.06] blur-md" />
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 h-5 flex-1 rounded-full bg-white/5 px-3 font-mono text-[10px] leading-5 text-faint">
            budi.dev
          </span>
        </div>
        <div className="space-y-3 p-5">
          <div className="relative h-8 w-3/4 overflow-hidden rounded bg-accent/70">
            <span className="animate-glare absolute inset-y-0 left-0 w-1/2 bg-white/25 blur-sm" />
          </div>
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5/6 rounded bg-white/10" />
            <span className="animate-load-blink inline-block h-3.5 w-[2px] bg-accent" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-7 w-20 rounded-sm bg-accent shadow-[0_0_18px_rgba(215,253,68,0.35)]" />
            <div className="h-7 w-20 rounded-sm border border-border" />
          </div>
        </div>
      </div>
    );
  }
  if (index === 2) {
    // Terminal with a pulse — glowing prompts, live cursor, ship badge.
    return (
      <div
        aria-hidden="true"
        className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface/90 font-mono text-xs leading-relaxed shadow-[0_0_50px_-20px_rgba(56,189,248,0.4)]"
      >
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[11px] tracking-[0.2em] text-faint">BUDI — ZSH</span>
          <span className="ml-auto rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-px text-[9px] tracking-[0.18em] text-emerald-400">
            SHIPPED
          </span>
        </div>
        <div className="space-y-2 px-5 py-5">
          <p><span className="text-accent" style={{ textShadow: "0 0 10px rgba(56,189,248,0.8)" }}>$ </span><span className="text-foreground">pnpm build</span></p>
          <p className="text-[#22c55e]">✓ Compiled successfully</p>
          <p><span className="text-accent" style={{ textShadow: "0 0 10px rgba(56,189,248,0.8)" }}>$ </span><span className="text-foreground">pnpm test</span></p>
          <p className="text-[#22c55e]">✓ All green — zero console errors</p>
          <p><span className="text-accent" style={{ textShadow: "0 0 10px rgba(56,189,248,0.8)" }}>$ </span><span className="text-foreground">deploy --prod</span></p>
          <p className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-accent" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-foreground">live</span>
            <span className="animate-load-blink inline-block h-3.5 w-[7px] bg-accent" />
          </p>
        </div>
      </div>
    );
  }
  if (index === 3) {
    // Vault seal — conic halo + shield + verified check.
    return (
      <div
        aria-hidden="true"
        className="relative flex h-60 w-60 flex-col items-center justify-center gap-3"
      >
        <span
          className="animate-pulse absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #fb718544 20%, transparent 40%, transparent 60%, #fb718544 80%, transparent 100%)",
            filter: "blur(6px)",
            animationDuration: "3s",
          }}
        />
        <span className="absolute inset-[5px] rounded-full border border-border bg-surface/90" />
        <ShieldCheck
          className="relative h-20 w-20 text-accent"
          strokeWidth={1.5}
          style={{ filter: "drop-shadow(0 0 18px rgba(251,113,133,0.5))" }}
        />
        <span className="relative rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-emerald-400">
          SECURE BY DEFAULT
        </span>
      </div>
    );
  }
  if (index === 4) {
    // Equalizer with a heartbeat — gradient bars, peak caps, live line.
    return (
      <div
        aria-hidden="true"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface/80 px-8 pt-10 pb-8"
      >
        <span className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/[0.05] blur-md" />
        <div className="flex h-36 items-end justify-center gap-2">
          {[38, 70, 52, 88, 60, 78, 44, 92, 56, 72].map((h, i) => (
            <span key={i} className="relative flex w-3 flex-col items-center gap-1" style={{ height: `${h}%` }}>
              <span className="h-1 w-3 rounded-full bg-accent/90" />
              <span
                className="animate-pulse w-3 flex-1 rounded-sm"
                style={{
                  background: "linear-gradient(to top, #34d39955, #34d399)",
                  boxShadow: "0 0 12px rgba(52,211,153,0.5)",
                  transformOrigin: "bottom",
                  animationDelay: `${i * 0.16}s`,
                  animationDuration: "1.4s",
                }}
              />
            </span>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] text-faint">
          <span>60 FPS</span>
          <span className="text-accent">ZERO JANK</span>
        </p>
      </div>
    );
  }
  if (index === 5) {
    // Connected systems — live CRM miniature: online status + counters.
    return (
      <div
        aria-hidden="true"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface/90"
      >
        <span className="animate-glare pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-white/[0.05] blur-md" />
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-faint">CRM · MANAGEMENT</span>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.18em] text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.4)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            ONLINE
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/5">
          {[
            { n: "248", l: "USERS" },
            { n: "96", l: "LEADS" },
            { n: "32%", l: "CONVERSION" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col items-center gap-0.5 bg-surface px-2 py-4">
              <span className="display text-2xl font-bold text-accent tabular-nums" style={{ textShadow: "0 0 16px rgba(251,191,36,0.4)" }}>{s.n}</span>
              <span className="font-mono text-[9px] tracking-[0.22em] text-faint">{s.l}</span>
            </div>
          ))}
        </div>
        <p className="border-t border-border px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-faint">
          Customer activity · Real-time · Automated
        </p>
      </div>
    );
  }
  if (index === 6) {
    // Intelligence in motion — AI assistant with a breathing gradient frame.
    return (
      <div
        aria-hidden="true"
        className="relative w-full max-w-sm rounded-xl p-[1.5px]"
        style={{ background: "linear-gradient(135deg, #22d3ee66, #a78bfa66, #22d3ee66)", boxShadow: "0 0 44px -12px rgba(34,211,238,0.5)" }}
      >
        <div className="rounded-[calc(0.75rem-1.5px)] bg-surface/95">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
              <Bot className="h-4 w-4" />
              <span className="animate-ping-soft absolute inset-0 rounded-lg border border-accent/60" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">BUDI — AI</p>
              <p className="font-mono text-[10px] tracking-[0.18em] text-emerald-400">● READY</p>
            </div>
            <Sparkles className="animate-pulse ml-auto h-4 w-4 text-accent" />
          </div>
          <div className="space-y-2.5 p-4 text-xs leading-relaxed">
            <p className="w-fit max-w-[85%] rounded-lg rounded-tl-sm border border-border bg-white/[0.04] px-3 py-2 text-muted">
              Summarize this week&apos;s sales
            </p>
            <p className="ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-sm bg-accent px-3 py-2 font-semibold text-accent-foreground shadow-[0_0_20px_rgba(34,211,238,0.35)]">
              +18% vs last week — 3 deals need follow-up
            </p>
            <p className="flex w-fit items-center gap-1.5 rounded-lg rounded-tl-sm border border-border bg-white/[0.04] px-3 py-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="animate-load-blink h-1.5 w-1.5 rounded-full bg-accent"
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              ))}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

interface StageProps {
  index: number;
  dir: number;
  total: number;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  go: (d: 1 | -1) => void;
  goTo: (i: number) => void;
  showHint: boolean;
}

/**
 * The stage itself — slide + freezing progress + control deck.
 * Rendered once in-flow and again inside the theater overlay,
 * both driven by the same parent state.
 */
function PlayStage({ index, dir, total, paused, setPaused, go, goTo, showHint }: StageProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const { t, lang } = useLanguage();
  const frozen = paused || reduced;

  const color = CHAPTER_COLORS[index % CHAPTER_COLORS.length] ?? "#d7fd44";
  const isFinale = index === t.play.chapters.length;
  const ch = isFinale ? null : t.play.chapters[index];
  const kicker = isFinale ? t.play.finaleKicker : (ch?.kicker ?? "");
  const labelFor = (i: number): string =>
    i < t.play.chapters.length ? (t.play.chapters[i]?.kicker ?? "") : t.play.finaleKicker;

  const techCount = stackChips.length;
  const specCount = t.hero.roles.length;
  const stats = [
    { value: techCount, label: t.play.stats.tech },
    { value: LANG_COUNT, label: t.play.stats.lang },
    { value: specCount, label: t.play.stats.spec },
  ];

  const flight = reduced
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <div>
      <div className="relative">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.article
            key={index}
            custom={dir}
            variants={slideVariants}
            initial={reduced ? false : "enter"}
            animate="center"
            exit="exit"
            transition={flight}
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.45}
            dragMomentum={false}
            onDragEnd={(_, info): void => {
              if (info.offset.x < -70) go(1);
              else if (info.offset.x > 70) go(-1);
            }}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${total}`}
            className="relative flex w-full flex-col justify-center overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
            style={{ minHeight: "min(72vh, 560px)" }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-[3px]"
              style={{ background: `linear-gradient(to right, ${color}, transparent)`, boxShadow: `0 0 16px ${color}` }}
            />
            {!isFinale && ch ? (
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="display pointer-events-none absolute -top-3 right-4 text-[6rem] leading-none font-black select-none sm:text-[9rem]"
                  style={{ color: `${color}1f`, textShadow: `0 0 60px ${color}33` }}
                >
                  0{index + 1}
                </span>
                <div
                  className="kenburns grid w-full items-center gap-8 px-6 py-10 sm:px-10 sm:py-12 md:grid-cols-2"
                  style={{
                    animationDuration: `${AUTOPLAY_MS}ms`,
                    animationPlayState: frozen ? "paused" : "running",
                  }}
                >
                  <div>
                    <p
                      className="flex w-fit items-center gap-2.5 rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-[0.3em] uppercase"
                      style={{ borderColor: `${color}55`, backgroundColor: `${color}12`, color }}
                    >
                      <span className="tabular-nums">0{index + 1}</span>
                      <span aria-hidden="true" className="h-3 w-px" style={{ backgroundColor: `${color}66` }} />
                      {ch.kicker}
                    </p>
                    <h3 className="display mt-5 text-[clamp(2rem,6vw,4.5rem)] leading-[0.92] font-black tracking-tight text-foreground uppercase">
                      <span className="block">{ch.a}</span>
                      <span className="text-stroke block">{ch.b}</span>
                    </h3>
                    <p className="mt-5 max-w-xl border-l-2 pl-5 text-[15px] leading-relaxed text-foreground/85 sm:text-base" style={{ borderColor: `${color}88` }}>
                      {ch.body}
                    </p>
                  </div>
                  <div className="flex w-full justify-center">
                    <ChapterVisual index={index} />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="kenburns relative flex w-full flex-col items-center overflow-hidden px-6 py-12 text-center sm:py-14"
                style={{
                  animationDuration: `${AUTOPLAY_MS}ms`,
                  animationPlayState: frozen ? "paused" : "running",
                }}
              >
                <div aria-hidden="true" className="marquee pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden opacity-[0.07]">
                  <div className="marquee-track flex w-max items-center gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className="display text-[8rem] font-black whitespace-nowrap text-foreground uppercase">
                        {t.play.finaleA} —
                      </span>
                    ))}
                  </div>
                </div>
                <p className="relative font-mono text-[11px] tracking-[0.35em] uppercase" style={{ color }}>
                  {t.play.finaleKicker}
                </p>
                <h3 className="display relative mt-5 text-[clamp(2rem,6.5vw,4.5rem)] leading-[0.95] font-black tracking-tight text-foreground uppercase">
                  <span className="block">{t.play.finaleA}</span>
                  <span className="block" style={{ color }}>{t.play.finaleB}</span>
                </h3>
                <div className="relative mt-8 flex items-stretch gap-8 sm:gap-12">
                  {stats.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1">
                      <CountUp
                        end={s.value}
                        className="display text-4xl font-bold text-foreground tabular-nums sm:text-5xl"
                      />
                      <span className="font-mono text-[10px] tracking-[0.25em] text-muted uppercase">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row">
                  <a
                    href="#contact"
                    className="group relative flex items-center gap-2 overflow-hidden bg-accent px-7 py-3.5 text-sm font-bold text-accent-foreground shadow-[0_14px_44px_-14px_var(--accent)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-14px_var(--accent)]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-[380%]"
                    />
                    <span className="relative">{t.play.cta}</span>
                    <ArrowUpRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                  <a
                    href="#projects"
                    className="px-4 py-3 text-sm font-semibold text-muted underline decoration-accent/50 underline-offset-8 transition-colors duration-200 hover:text-accent"
                  >
                    {t.hero.explore}
                  </a>
                </div>
                <p className="relative mt-4 font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                  {t.play.note}
                </p>
              </div>
            )}
          </motion.article>
        </AnimatePresence>

        {/* First-run swipe hint — vanishes on first manual touch */}
        {showHint && !reduced && (
          <div className="pointer-events-none absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-muted uppercase">
            <ChevronsLeftRight className="animate-pulse h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {lang === "fr" ? "Glissez" : "Swipe"}
          </div>
        )}
      </div>

      {/* ——— Autoplay progress — freezes mid-flight on hover ——— */}
      {!reduced && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <span
            key={index}
            className="playfill block h-full w-full origin-left rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
              animationDuration: `${AUTOPLAY_MS}ms`,
              animationPlayState: frozen ? "paused" : "running",
            }}
          />
        </div>
      )}

      {/* ——— Control deck ——— */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="min-w-24 text-center font-mono text-xs tracking-[0.25em] text-muted tabular-nums">
          0{index + 1} <span className="text-faint">/ 0{total}</span>
        </span>
        <span className="hidden max-w-44 truncate font-mono text-[10px] tracking-[0.22em] text-faint uppercase sm:block">
          {kicker}
        </span>
        <span className="flex items-center gap-1.5" role="group" aria-label={t.play.goto}>
          {Array.from({ length: total }).map((_, i) => {
            const dotColor = CHAPTER_COLORS[i % CHAPTER_COLORS.length] ?? "#d7fd44";
            const on = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${t.play.goto} ${i + 1} — ${labelFor(i)}`}
                title={labelFor(i)}
                aria-current={on || undefined}
                style={on ? { backgroundColor: dotColor, boxShadow: `0 0 12px ${dotColor}` } : undefined}
                className={cn(
                  "h-2 cursor-pointer rounded-full transition-all duration-300",
                  on ? "w-6" : "w-2 bg-white/20 hover:bg-white/50",
                )}
              />
            );
          })}
        </span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          aria-pressed={paused}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next slide"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-accent-foreground transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: color, boxShadow: `0 8px 26px -10px ${color}` }}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * ScrollPlay v4 — the journey every visitor lives.
 *
 * Featherweight slideshow (no scroll listeners, no sticky, no backdrop-blur)
 * wrapped in a cinematic shell: a giant ghost word + a color wash follow the
 * active slide, autoplay runs ONLY while the section is on screen and the tab
 * is visible, a "play the journey" button pulls any visitor into slide one,
 * and a theater mode blows the whole show up to fullscreen. Rare-fire
 * listeners only (IntersectionObserver + visibilitychange) — nothing
 * per-frame, nothing to jank.
 */
export default function ScrollPlay(): React.JSX.Element {
  const reduced = useReducedMotion();
  const { t, lang } = useLanguage();
  const total = t.play.chapters.length + 1;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [theater, setTheater] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);

  /* Manual moves mark first contact (hides the swipe hint). Autoplay never does. */
  const go = useCallback(
    (d: 1 | -1): void => {
      setInteracted(true);
      setDir(d);
      setIndex((i) => (i + d + total) % total);
    },
    [total],
  );
  const goTo = useCallback(
    (i: number): void => {
      setInteracted(true);
      setIndex((cur) => {
        if (i !== cur) setDir(i > cur ? 1 : -1);
        return i;
      });
    },
    [],
  );

  /* Autoplay — one quiet timeout, gated on visibility, re-armed per slide. */
  useEffect(() => {
    if (reduced || paused || !inView || tabHidden) return;
    const id = window.setTimeout(() => {
      setDir(1);
      setIndex((i) => (i + 1 + total) % total);
    }, AUTOPLAY_MS);
    return (): void => {
      window.clearTimeout(id);
    };
  }, [index, paused, reduced, inView, tabHidden, total]);

  /* Rare-fire gates — IntersectionObserver + tab visibility, never per-frame. */
  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec || reduced) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e) setInView(e.isIntersecting);
    }, { threshold: 0.25 });
    io.observe(sec);
    return (): void => {
      io.disconnect();
    };
  }, [reduced]);
  useEffect(() => {
    const onVis = (): void => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return (): void => {
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /* Theater — ESC to close, body locked while open. */
  useEffect(() => {
    if (!theater) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setTheater(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [theater]);

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };

  /** Pull any visitor into the journey — restart, unpause, glide to stage. */
  const playJourney = (): void => {
    setPaused(false);
    setInteracted(true);
    setDir(1);
    setIndex(0);
    window.setTimeout(() => {
      stageWrapRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }, 60);
  };

  const color = CHAPTER_COLORS[index % CHAPTER_COLORS.length] ?? "#d7fd44";
  const isFinale = index === t.play.chapters.length;
  const ghostWord = isFinale
    ? t.play.finaleB
    : (t.play.chapters[index]?.b ?? t.play.chapters[index]?.a ?? "");
  const kicker = isFinale ? t.play.finaleKicker : (t.play.chapters[index]?.kicker ?? "");

  const stageProps = { index, dir, total, paused, setPaused, go, goTo, showHint: !interacted };

  return (
    <section
      ref={sectionRef}
      id="scrollplay"
      aria-label={t.play.hint}
      className="relative overflow-clip border-t border-border py-16 sm:py-20"
    >
      {/* ——— Ambient: slide-tinted wash + static auroras (zero JS per-frame) ——— */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 transition-[background-color] duration-700"
          style={{ backgroundColor: `${color}0d` }}
        />
        <div
          className="animate-aurora-a absolute top-[6%] left-[8%] h-[420px] w-[420px]"
          style={{ background: "radial-gradient(circle, rgba(215,253,68,0.08) 0%, transparent 68%)" }}
        />
        <div
          className="animate-aurora-b absolute right-[4%] bottom-[4%] h-[380px] w-[380px]"
          style={{ background: "radial-gradient(circle, rgba(255,61,0,0.08) 0%, transparent 68%)" }}
        />
        <div className="bg-blueprint absolute inset-0 opacity-60" />
      </div>

      {/* ——— Giant ghost word — crossfades with the active slide ——— */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-10 overflow-hidden text-center select-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="display block text-[17vw] leading-none font-black whitespace-nowrap uppercase text-transparent lg:text-[10rem]"
            style={{ WebkitTextStroke: `1px ${color}40` }}
          >
            {ghostWord}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* ——— Invitation: hint + play + theater ——— */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex items-center gap-3 rounded-full border border-accent/25 bg-surface px-6 py-3">
            <svg width="18" height="26" viewBox="0 0 20 30" fill="none" aria-hidden="true" className="text-accent">
              <rect x="1" y="1" width="18" height="28" rx="9" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="7" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-[11px] tracking-[0.3em] text-muted uppercase md:text-xs">
              {t.play.hint}
            </span>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={playJourney}
              className="group flex cursor-pointer items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-black text-accent-foreground shadow-[0_14px_44px_-14px_var(--accent)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-14px_var(--accent)]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              {lang === "fr" ? "Vivre l'expérience" : "Play the journey"}
            </button>
            <button
              type="button"
              onClick={() => setTheater(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              <Expand className="h-4 w-4" aria-hidden="true" />
              {lang === "fr" ? "Mode cinéma" : "Theater mode"}
            </button>
          </div>
        </div>

        {/* ——— Stage ——— */}
        <div
          ref={stageWrapRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={t.play.hint}
          tabIndex={0}
          onKeyDown={onKey}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="relative z-10 mt-10 scroll-mt-28 outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <PlayStage {...stageProps} />
        </div>
      </div>

      {/* ——— Theater — the full-screen experience ——— */}
      <AnimatePresence>
        {theater && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label={t.play.hint}
            onKeyDown={onKey}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onClick={(e): void => {
              if (e.target === e.currentTarget) setTheater(false);
            }}
            className="fixed inset-0 z-[90] flex flex-col bg-black"
          >
            {/* Letterbox top — LIVE transport header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <p className="flex min-w-0 items-center gap-2.5 font-mono text-[11px] tracking-[0.22em] uppercase">
                <span className="relative flex h-2 w-2 shrink-0">
                  {!reduced && (
                    <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-red-500" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="font-black text-red-400">Live</span>
                <span className="hidden truncate text-white/50 sm:inline">{kicker}</span>
              </p>
              <p className="shrink-0 font-mono text-xs tracking-[0.25em] text-white/60 tabular-nums">
                0{index + 1} <span className="text-white/30">/ 0{total}</span>
              </p>
              <button
                autoFocus
                type="button"
                onClick={() => setTheater(false)}
                aria-label="Close theater"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/70 transition-all duration-200 hover:rotate-90 hover:border-accent hover:text-accent"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {/* Screen — the show, wrapped in a static vignette */}
            <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl p-4 sm:p-8">
                <PlayStage {...stageProps} />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)",
                }}
              />
            </div>
            {/* Letterbox bottom — transport hint */}
            <p className="shrink-0 border-t border-white/10 py-2.5 text-center font-mono text-[10px] tracking-[0.3em] text-white/35 uppercase">
              ESC · ← →
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
