"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Footprints } from "lucide-react";
import CountUp from "@/components/CountUp";
import { stackChips } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const LANG_COUNT = 3;

/** Official gold leads the climb — the rest whisper. */
const STEP_COLORS = [
  "#D4AF37",
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#22d3ee",
] as const;

/** Where each stair lands on the live page. */
const STEP_HREF = ["#about", "#projects", "#services", "#skills", "#projects", "#services", "#contact"] as const;

/**
 * ScrollPlay v6 — the staircase.
 *
 * No slideshow, no autoplay, no theater, no drag: a luxury staircase of
 * chapters. Each step lands deeper (staggered offset like stairs), reveals
 * once on scroll, and its CTA walks you to the real section it describes.
 * One IntersectionObserver per card via whileInView — nothing per-frame,
 * nothing to jank. Mobile stacks straight; desktop climbs like stairs.
 */
export default function ScrollPlay(): React.JSX.Element {
  const reduced = useReducedMotion();
  const { t, lang } = useLanguage();
  const steps = t.play.chapters;
  const total = steps.length + 1;

  const techCount = stackChips.length;
  const specCount = t.hero.roles.length;
  const stats = [
    { value: techCount, label: t.play.stats.tech },
    { value: LANG_COUNT, label: t.play.stats.lang },
    { value: specCount, label: t.play.stats.spec },
  ];

  const scrollTo = (href: string): void => {
    document.querySelector(href)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <section id="scrollplay" aria-label={t.play.hint} className="relative overflow-clip border-t border-border py-16 sm:py-20">
      {/* Ambient — one soft gold wash, one blueprint veil */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(212,175,55,0.06), transparent 65%)" }}
        />
        <div className="bg-blueprint absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Invitation */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex items-center gap-3 rounded-full border border-[#d4af37]/25 bg-surface px-6 py-3">
            <Footprints className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-[0.3em] text-muted uppercase md:text-xs">
              {t.play.hint}
            </span>
          </span>
          <h2 className="display text-[clamp(1.8rem,5vw,3.2rem)] font-black tracking-tight text-foreground uppercase">
            {lang === "fr" ? "Montez" : "Climb"} <span className="text-[#d4af37]">{lang === "fr" ? "l'escalier" : "the stairs"}</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            {lang === "fr"
              ? "Sept marches — chacune mène à sa vraie section du site."
              : "Seven steps — each one walks you to its real section of the site."}
          </p>
        </div>

        {/* Spine + stairs */}
        <div className="relative mt-12">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-[#d4af37]/60 via-[#d4af37]/20 to-transparent sm:left-[23px]"
          />
          <ol className="flex flex-col gap-5 sm:gap-6">
            {steps.map((ch, i) => {
              const color = STEP_COLORS[i % STEP_COLORS.length] ?? "#D4AF37";
              const href = STEP_HREF[i % STEP_HREF.length] ?? "#contact";
              return (
                <motion.li
                  key={ch.kicker}
                  initial={reduced ? false : { opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("relative pl-12 sm:pl-14")}
                  style={{ marginLeft: `min(${i * 3.5}%, 180px)` }}
                >
                  {/* Step node */}
                  <span
                    aria-hidden="true"
                    className="absolute top-7 left-0 flex h-10 w-10 items-center justify-center rounded-full border bg-background font-mono text-[11px] font-black tabular-nums sm:h-12 sm:w-12"
                    style={{ borderColor: `${color}66`, color, boxShadow: `0 0 18px ${color}33` }}
                  >
                    0{i + 1}
                  </span>
                  <article
                    aria-label={`${i + 1} / ${total} — ${ch.kicker}`}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-surface transition-colors duration-300 hover:border-[#d4af37]/40"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[2px]"
                      style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
                    />
                    <span
                      aria-hidden="true"
                      className="display pointer-events-none absolute -top-2 right-4 text-[4.5rem] leading-none font-black select-none sm:text-[6rem]"
                      style={{ color: `${color}12` }}
                    >
                      0{i + 1}
                    </span>
                    <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <p
                          className="flex w-fit items-center gap-2.5 rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-[0.3em] uppercase"
                          style={{ borderColor: `${color}55`, backgroundColor: `${color}12`, color }}
                        >
                          <span className="tabular-nums">0{i + 1}</span>
                          <span aria-hidden="true" className="h-3 w-px" style={{ backgroundColor: `${color}66` }} />
                          {ch.kicker}
                        </p>
                        <h3 className="display mt-4 text-[clamp(1.7rem,4.5vw,3rem)] leading-[0.95] font-black tracking-tight text-foreground uppercase">
                          <span className="block">{ch.a}</span>
                          <span className="text-stroke block">{ch.b}</span>
                        </h3>
                        <p className="mt-4 max-w-xl border-l-2 pl-5 text-[14px] leading-relaxed text-foreground/85 sm:text-[15px]" style={{ borderColor: `${color}88` }}>
                          {ch.body}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-row items-center gap-2.5 md:flex-col">
                        <button
                          type="button"
                          onClick={() => scrollTo(href)}
                          className="group/btn flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-black text-[#0b0b0c] transition-transform duration-200 hover:-translate-y-0.5"
                          style={{ background: `linear-gradient(120deg, ${color}, #f9edb0)` }}
                          aria-label={`${ch.kicker} — ${lang === "fr" ? "voir la section" : "visit section"}`}
                        >
                          {lang === "fr" ? "Voir" : "Visit"}
                          <ArrowDown className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-y-0.5" aria-hidden="true" />
                        </button>
                        <span className="font-mono text-[10px] tracking-[0.25em] text-faint uppercase tabular-nums">
                          0{i + 1} / 0{total}
                        </span>
                      </div>
                    </div>
                  </article>
                </motion.li>
              );
            })}

            {/* Summit — the finale platform */}
            <motion.li
              initial={reduced ? false : { opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative pl-12 sm:pl-14"
              style={{ marginLeft: "min(24%, 200px)" }}
            >
              <span
                aria-hidden="true"
                className="absolute top-7 left-0 flex h-10 w-10 items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] font-mono text-[11px] font-black text-[#0b0b0c] tabular-nums sm:h-12 sm:w-12"
                style={{ boxShadow: "0 0 26px rgba(212,175,55,0.55)" }}
              >
                ★
              </span>
              <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-gradient-to-br from-[#d4af37]/[0.1] via-surface to-surface px-6 py-10 text-center sm:px-10 sm:py-12">
                <p className="font-mono text-[11px] tracking-[0.35em] text-[#d4af37] uppercase">
                  {t.play.finaleKicker}
                </p>
                <h3 className="display mt-4 text-[clamp(1.9rem,5.5vw,3.8rem)] leading-[0.95] font-black tracking-tight text-foreground uppercase">
                  <span className="block">{t.play.finaleA}</span>
                  <span className="block text-[#d4af37]">{t.play.finaleB}</span>
                </h3>
                <div className="mt-7 flex items-stretch justify-center gap-8 sm:gap-12">
                  {stats.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1">
                      <CountUp end={s.value} className="display text-4xl font-bold text-foreground tabular-nums sm:text-5xl" />
                      <span className="font-mono text-[10px] tracking-[0.25em] text-muted uppercase">{s.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#contact"
                    className="flex items-center gap-2 rounded-full bg-[#d4af37] px-7 py-3.5 text-sm font-black text-[#0b0b0c] transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ boxShadow: "0 14px 40px -14px rgba(212,175,55,0.7)" }}
                  >
                    {t.play.cta}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a href="#projects" className="px-4 py-3 text-sm font-semibold text-muted underline decoration-[#d4af37]/50 underline-offset-8 transition-colors hover:text-[#d4af37]">
                    {t.hero.explore}
                  </a>
                </div>
                <p className="mt-4 font-mono text-[11px] tracking-[0.2em] text-faint uppercase">{t.play.note}</p>
              </div>
            </motion.li>
          </ol>
        </div>
      </div>
    </section>
  );
}
