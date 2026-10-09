"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDownRight,
  BookOpen,
  Feather,
  GraduationCap,
  Languages,
  Layers,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import SmartImage from "@/components/SmartImage";
import type { SiteAvailability } from "@/components/WorkStatus";
import { formatBadgeDate, workLabel } from "@/components/WorkStatus";
import { personal, profile, stackChips } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNow } from "@/hooks/useNow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clockParts, daysToBirthday, fullYears, parseISODate, totalDays } from "@/lib/age";
import { getAcademicStatus } from "@/lib/education";
import type { LocalizedText } from "@/types";

/** One icon per highlight card — product, quality, languages, launch. */
const CARD_ICONS = [Layers, ShieldCheck, Languages, Rocket] as const;

/** Fraction of the current age-year already lived (birthday → birthday). */
function yearProgress(birth: Date, now: Date): number {
  const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate()).getTime();
  const nowMs = now.getTime();
  const last =
    thisYear <= nowMs
      ? thisYear
      : new Date(now.getFullYear() - 1, birth.getMonth(), birth.getDate()).getTime();
  const next =
    thisYear > nowMs
      ? thisYear
      : new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate()).getTime();
  if (next <= last) return 0;
  return Math.min(1, Math.max(0, (nowMs - last) / (next - last)));
}

/** Live birthdate-driven cells — null-safe until mount (hydration-clean). */
function LiveCells({ birthISO }: { birthISO: string }): React.JSX.Element | null {
  const now = useNow(1000);
  const { t, lang } = useLanguage();
  if (!now) return null;
  const birth = parseISODate(birthISO);
  if (!birth) return null;
  const clock = clockParts(birth, now);
  const yearPct = Math.round(yearProgress(birth, now) * 100);
  return (
    <>
      <div className="flex flex-col items-center gap-1 px-4 py-8 text-center transition-colors duration-300 hover:bg-accent/[0.04]">
        <span className="display text-5xl font-bold text-foreground tabular-nums sm:text-6xl">
          {fullYears(birth, now)}
        </span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
          {t.about.statsAgeLabel}
        </span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
          {t.about.statsAgeSub}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 px-4 py-8 text-center transition-colors duration-300 hover:bg-accent/[0.04]">
        <span className="display text-5xl font-bold text-foreground tabular-nums sm:text-6xl">
          {totalDays(birth, now).toLocaleString("en-US").replace(/,/g, " ")}
        </span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
          {t.about.statsDaysLabel}
        </span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-accent tabular-nums">
          {clock.h}:{clock.m}:{clock.s} · {t.about.statsDaysSub}
        </span>
      </div>
      <div className="group flex flex-col items-center gap-1 px-4 py-8 text-center transition-colors duration-300 hover:bg-accent/[0.04]">
        <span className="display text-5xl font-bold text-accent tabular-nums drop-shadow-[0_0_18px_rgba(255,61,0,0.25)] sm:text-6xl">
          {daysToBirthday(birth, now)}
        </span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
          {t.about.statsCakeLabel}
        </span>
        <span
          aria-hidden="true"
          className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-border"
        >
          <span
            className="block h-full rounded-full bg-accent shadow-[0_0_8px_rgba(255,61,0,0.8)]"
            style={{ width: `${yearPct}%` }}
          />
        </span>
        <span className="font-mono text-[10px] tracking-[0.18em] text-faint uppercase tabular-nums">
          {yearPct}% · {lang === "fr" ? "année écoulée" : "year complete"}
        </span>
      </div>
    </>
  );
}

/** Live Suez clock under the portrait — null-safe until mount. */
function SuezClock(): React.JSX.Element | null {
  const now = useNow(1000);
  const { t } = useLanguage();
  const time = useMemo(() => {
    if (!now) return null;
    try {
      return new Intl.DateTimeFormat(t.intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      }).format(now);
    } catch {
      return null;
    }
  }, [now, t.intlLocale]);
  if (!time || !now) return null;
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      <time dateTime={now.toISOString()}>{time}</time> {t.hero.inSuez}
    </span>
  );
}

export default function About({
  availability,
  image,
}: {
  availability?: SiteAvailability;
  /** Dashboard-owned about photo — falls back to the baked-in portrait. */
  image?: string;
}): React.JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { t, lang } = useLanguage();
  /** Dashboard-owned orbit badge — flips with the master switch. */
  const avail: SiteAvailability = availability ?? { status: "available", note: "", noteFr: "", until: "" };
  const backDate = formatBadgeDate(avail.until, lang);
  const orbitText =
    avail.status === "available"
      ? lang === "fr"
        ? "DISPONIBLE • CONTACTEZ-MOI • "
        : "OPEN FOR WORK • CONTACT ME • "
      : `${workLabel(avail, lang, { available: t.hero.available, unavailable: t.hero.unavailable }).toUpperCase()} • ${
          backDate ? (lang === "fr" ? `RETOUR ${backDate.toUpperCase()} • ` : `BACK ${backDate.toUpperCase()} • `) : ""
        }${lang === "fr" ? "CONTACTEZ-MOI" : "CONTACT ME"} • `;
  const pick = (v: LocalizedText): string => (lang === "fr" ? v.fr : v.en);
  /** Storytelling chapters — inline copy so the narrative never waits on shared keys. */
  const kickers =
    lang === "fr"
      ? ["Chapitre 01 — Le bâtisseur", "Chapitre 02 — L'ingénieur", "Chapitre 03 — La mission"]
      : ["Chapter 01 — The Builder", "Chapter 02 — The Engineer", "Chapter 03 — The Mission"];
  const hasBirthdate = parseISODate(personal.birthdate) !== null;
  const hasEducation = personal.education.length > 0;
  const status = getAcademicStatus();
  const levelInfo =
    status.kind === "studying" ? (t.about.levels[status.level - 1] ?? t.about.levels[0]) : null;
  const frLang = lang === "fr";
  /** Magazine meta — computed from real copy, never hardcoded. */
  const storyWords = t.about.story.join(" ").split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(storyWords / 200));
  const storyLabel = frLang ? "Mon histoire" : "My story";
  const minLabel = frLang ? "min de lecture" : "min read";
  const chaptersLabel = frLang ? "chapitres" : "chapters";
  const pullQuote = frLang
    ? "Un grand logiciel doit aussi être un logiciel sûr."
    : "Great software must also be safe software.";
  const pullBy = frLang ? "— Ma règle d'or" : "— My golden rule";
  const signRole = frLang ? "Développeur Full-Stack — Suez" : "Full-Stack Developer — Suez";
  const principles = frLang
    ? [
        { icon: Zap, label: "Performance d'abord" },
        { icon: ShieldCheck, label: "Sécurisé par défaut" },
        { icon: Feather, label: "Design avec intention" },
      ]
    : [
        { icon: Zap, label: "Performance first" },
        { icon: ShieldCheck, label: "Secure by default" },
        { icon: Feather, label: "Design with intent" },
      ];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-about-fade]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-about-mask]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.fromTo(
        "[data-about-card]",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-about-cards]", start: "top 85%", once: true },
        },
      );
    }, root);

    return (): void => {
      ctx.revert();
    };
  }, [reduced]);

  const onStoryMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${(event.clientX - rect.left).toFixed(0)}px`);
    el.style.setProperty("--sy", `${(event.clientY - rect.top).toFixed(0)}px`);
  };

  const onFrameMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
  };
  const onFrameLeave = (): void => {
    if (frameRef.current) frameRef.current.style.transform = "";
  };

  return (
    <section
      ref={rootRef}
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-clip border-t border-border"
    >
      {/* Marquee ribbon */}
      <div
        aria-hidden="true"
        className="marquee relative overflow-hidden border-b border-border py-2.5"
      >
        <div className="marquee-track flex w-max items-center gap-6 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-6 font-mono text-[11px] tracking-[0.35em] whitespace-nowrap text-faint uppercase"
            >
              {t.about.title}
              <span className="h-1 w-1 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(255,61,0,0.06), transparent 65%)",
        }}
      />
      {/* Giant watermark */}
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-16 right-0 hidden text-[20vw] leading-none opacity-20 select-none md:block"
      >
        01
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        {/* ——— Title ——— */}
        <div data-about-fade className="flex flex-col items-center text-center">
          <p className="flex items-center gap-4 font-mono text-xs tracking-[0.35em] text-faint uppercase">
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60"
            />
            {t.about.eyebrow}
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60"
            />
          </p>
          <h2
            id="about-heading"
            className="display relative mt-4 text-4xl font-bold tracking-tight text-accent drop-shadow-[0_0_28px_rgba(255,61,0,0.25)] md:text-6xl xl:text-7xl"
          >
            {!reduced && (
              <>
                <Sparkles className="animate-float-slow absolute -top-2 -left-8 h-5 w-5 text-accent/70" aria-hidden="true" />
                <Sparkles className="animate-float-slow absolute -right-7 bottom-1 h-4 w-4 text-accent/50" style={{ animationDelay: "1.6s" }} aria-hidden="true" />
              </>
            )}
            {t.about.title}
          </h2>
          <blockquote className="relative mt-8 max-w-2xl rounded-2xl border border-accent/15 bg-accent/[0.04] px-8 pt-10 pb-7 backdrop-blur-sm">
            <span className="absolute -top-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-accent/40 bg-background text-accent shadow-[0_0_18px_rgba(255,61,0,0.45)]">
              <Quote className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="font-serif text-xl leading-relaxed font-medium text-foreground/90 italic md:text-2xl">
              {t.about.lede}
            </p>
            <span aria-hidden="true" className="story-rule mx-auto mt-5 block w-28 opacity-70" />
          </blockquote>
        </div>

        {/* ——— Story + portrait ——— */}
        <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="relative w-full flex-1 lg:max-w-2xl">
            {/* Magic aurora wash behind the editorial column */}
            <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-10 overflow-hidden">
              <div className="animate-aurora-a absolute -top-10 -left-10 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(215,253,68,0.10) 0%, transparent 65%)" }} />
              <div className="animate-aurora-b absolute top-1/3 -right-12 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,61,0,0.10) 0%, transparent 65%)" }} />
              <div className="animate-aurora-c absolute -bottom-10 left-1/4 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)" }} />
            </div>
            <p
              data-about-fade
              className="flex w-fit items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-muted uppercase"
            >
              <span className="relative flex h-2 w-2">
                {!reduced && (
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-accent" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {t.hero.currently} — {t.hero.building}
            </p>

            {/* ——— Editorial story header ——— */}
            <div data-about-fade className="mt-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {storyLabel}
                </p>
                <h3 className="display mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {frLang ? "L'histoire derrière le code" : "The story behind the code"}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                <span className="rounded-full border border-border px-3 py-1.5 tabular-nums">
                  {t.about.story.length} {chaptersLabel}
                </span>
                <span className="rounded-full border border-border px-3 py-1.5 tabular-nums">
                  ~{readMins} {minLabel}
                </span>
              </div>
            </div>

            {/* ——— Story chapters — magazine cards, serif body ——— */}
            <div className="relative mt-6">
              <span aria-hidden="true" className="absolute top-4 bottom-4 left-[27px] w-px bg-gradient-to-b from-accent/60 via-[#ff3d00]/40 to-transparent" />
              <div className="space-y-5">
                {t.about.story.map((paragraph, i) => (
                  <article
                    key={i}
                    data-about-mask
                    onMouseMove={onStoryMove}
                    className="story-card group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_20px_60px_-24px_var(--accent)] sm:p-7"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 h-[3px] w-0 bg-gradient-to-r from-accent to-[#ff3d00] shadow-[0_0_12px_rgba(255,61,0,0.8)] transition-all duration-500 group-hover:w-full"
                    />
                    <div className="relative z-[2] flex items-start gap-5">
                      <span className="flex flex-col items-center gap-2">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 shadow-[0_0_18px_rgba(215,253,68,0.15)]">
                          <span className="story-chapter-num display text-2xl font-bold tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.28em] text-accent uppercase">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                          {kickers[i % kickers.length]}
                        </p>
                        <p className={i === 0 ? "story-body story-dropcap mt-3" : "story-body mt-3"}>
                          {paragraph}
                        </p>
                      </div>
                    </div>
                    <span aria-hidden="true" className="story-rule relative z-[2] mt-5 block w-full opacity-40" />
                    <p className="relative z-[2] mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-faint uppercase">
                      <span className="tabular-nums">
                        {String(i + 1).padStart(2, "0")} / {String(t.about.story.length).padStart(2, "0")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-accent" />
                        {frLang ? "À suivre" : "To be continued"}
                      </span>
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* ——— Pull quote — golden rule in a breathing gradient frame ——— */}
            <figure
              data-about-fade
              className="relative mt-6 overflow-hidden rounded-2xl p-[1.5px]"
              style={{
                background:
                  "linear-gradient(120deg, rgba(215,253,68,0.55), rgba(255,61,0,0.55) 40%, rgba(139,92,246,0.55))",
                boxShadow: "0 0 50px -18px rgba(255,61,0,0.5)",
              }}
            >
              <div className="relative overflow-hidden rounded-[calc(1rem-1.5px)] bg-surface/95 px-6 py-7 text-center backdrop-blur-xl sm:p-8">
                {!reduced && (
                  <>
                    <Sparkles className="animate-float-slow absolute top-4 left-6 h-4 w-4 text-accent/60" aria-hidden="true" />
                    <Sparkles className="animate-float-slow absolute right-8 bottom-5 h-3 w-3 text-accent/40" style={{ animationDelay: "1.2s" }} aria-hidden="true" />
                    <span aria-hidden="true" className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/[0.05] blur-md" />
                  </>
                )}
                <Quote className="relative mx-auto h-6 w-6 text-accent drop-shadow-[0_0_10px_rgba(255,61,0,0.6)]" aria-hidden="true" />
                <blockquote className="relative mx-auto mt-3 max-w-xl font-serif text-xl leading-relaxed font-medium text-foreground italic md:text-2xl">
                  &ldquo;{pullQuote}&rdquo;
                </blockquote>
                <figcaption className="relative mt-3 font-mono text-[11px] tracking-[0.28em] text-accent uppercase">
                  {pullBy}
                </figcaption>
              </div>
            </figure>

            {/* ——— Principles + signature ——— */}
            <div data-about-fade className="mt-6 flex flex-wrap items-center gap-2">
              {principles.map((p) => {
                const Icon = p.icon;
                return (
                  <span
                    key={p.label}
                    className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted uppercase transition-colors duration-200 hover:border-accent/50 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    {p.label}
                  </span>
                );
              })}
            </div>
            <div data-about-fade className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-5">
              <div className="group/sign">
                <p className="relative w-fit font-serif text-2xl text-foreground italic md:text-3xl">
                  <span
                    className="absolute -bottom-1 left-0 h-[2px] w-2/3 origin-left bg-gradient-to-r from-accent via-[#ff3d00] to-transparent shadow-[0_0_10px_rgba(255,61,0,0.7)] transition-all duration-500 group-hover/sign:w-full"
                    aria-hidden="true"
                  />
                  {profile.name}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                  {signRole}
                </p>
              </div>
              <span className="mb-1 hidden items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-accent uppercase sm:flex">
                <Feather className="h-3.5 w-3.5" aria-hidden="true" />
                {frLang ? "Signé" : "Signed"}
              </span>
            </div>

            {/* ——— Highlight cards ——— */}
            <div data-about-cards className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {t.about.cards.map((card, i) => {
                const Icon = CARD_ICONS[i % CARD_ICONS.length] ?? Layers;
                return (
                  <div
                    key={card.title}
                    data-about-card
                    className="group relative overflow-hidden rounded-xl border border-accent/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_16px_50px_-20px_var(--accent)]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 h-[3px] w-0 bg-accent shadow-[0_0_12px_rgba(255,61,0,0.8)] transition-all duration-500 group-hover:w-full"
                    />
                    <span
                      aria-hidden="true"
                      className="display absolute -top-1 right-3 text-5xl font-bold text-foreground/[0.07] select-none"
                    >
                      0{i + 1}
                    </span>
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="relative mt-3 text-2xl font-bold text-accent">{card.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted">{card.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ——— Portrait — orbital seal + floating magic chips ——— */}
          <div data-about-fade className="group/portrait relative w-[280px] shrink-0 md:w-[320px] lg:sticky lg:top-28">
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 rounded-full opacity-80 transition-opacity duration-500 group-hover/portrait:opacity-100"
              style={{ background: "radial-gradient(circle, rgba(215,253,68,0.22) 0%, transparent 65%)" }}
            />
            {!reduced && (
              <div aria-hidden="true" className="pointer-events-none absolute -inset-5">
                <span className="animate-spin-slow absolute inset-0 rounded-[2rem] border border-dashed border-accent/35" />
                <span
                  className="animate-spin-slow absolute inset-3 rounded-[1.6rem] border-t border-[#ff3d00]/50"
                  style={{ animationDirection: "reverse", animationDuration: "14s" }}
                />
                <span className="animate-ping-soft absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(215,253,68,0.9)]" />
              </div>
            )}
            {/* Floating magic chips */}
            <div aria-hidden="true" className="absolute -top-5 -left-8 z-10 hidden sm:block">
              <span className="animate-float-slow flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-accent uppercase shadow-[0_0_18px_rgba(215,253,68,0.25)] backdrop-blur-md">
                <Zap className="h-3 w-3" /> {frLang ? "Rapide" : "Fast"}
              </span>
            </div>
            <div aria-hidden="true" className="absolute top-1/2 -right-9 z-10 hidden sm:block">
              <span
                className="animate-float-slow flex items-center gap-1.5 rounded-full border border-[#ff3d00]/40 bg-background/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-[#ff3d00] uppercase shadow-[0_0_18px_rgba(255,61,0,0.25)] backdrop-blur-md"
                style={{ animationDelay: "1.4s" }}
              >
                <ShieldCheck className="h-3 w-3" /> {frLang ? "Sécurisé" : "Secure"}
              </span>
            </div>
            <div aria-hidden="true" className="absolute -bottom-5 -left-6 z-10 hidden sm:block">
              <span
                className="animate-float-slow flex items-center gap-1.5 rounded-full border border-[#8b5cf6]/40 bg-background/85 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-[#a78bfa] uppercase shadow-[0_0_18px_rgba(139,92,246,0.25)] backdrop-blur-md"
                style={{ animationDelay: "2.2s" }}
              >
                <Sparkles className="h-3 w-3" /> {frLang ? "Magique" : "Magical"}
              </span>
            </div>
            <div
              className="[perspective:1000px]"
              onMouseMove={onFrameMove}
              onMouseLeave={onFrameLeave}
            >
              <div
                ref={frameRef}
                className="group relative aspect-[5/8] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] transition-all duration-300 ease-out will-change-transform hover:border-accent/50 hover:shadow-[0_30px_90px_-24px_rgba(255,61,0,0.45)]"
              >
                <SmartImage
                  src={image && image.trim() !== "" ? image : "/images/general/about2.jpg"}
                  alt={t.about.photoAlt}
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 280px, 320px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-3 rounded-[20px] border border-white/15"
                />
                {!reduced && (
                  <span
                    aria-hidden="true"
                    className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                )}
              </div>
            </div>
            {/* Orbiting contact badge — spins slowly, lands on #contact */}
            <a
              href="#contact"
              aria-label={`${orbitText.trim()} — ${lang === "fr" ? "contactez-moi" : "contact me"}`}
              title={`${orbitText.trim()} — ${lang === "fr" ? "contactez-moi" : "contact me"}`}
              className="absolute -right-4 -bottom-7 z-10 flex h-28 w-28 items-center justify-center rounded-full border border-accent/40 bg-background/85 text-muted backdrop-blur-md transition-colors duration-300 hover:text-accent"
            >
              <span aria-hidden="true" className="animate-spin-slow absolute inset-0">
                <svg viewBox="0 0 100 100" className="block h-full w-full">
                  <defs>
                    <path
                      id="about-orbit"
                      d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                    />
                  </defs>
                  <text fontSize="10" letterSpacing="2" fill="currentColor" fontFamily="monospace">
                    <textPath href="#about-orbit" textLength="224">
                      {orbitText}
                    </textPath>
                  </text>
                </svg>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_0_18px_rgba(255,61,0,0.5)]">
                <ArrowDownRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </a>
            <p className="mt-4 text-center font-mono text-[11px] tracking-[0.22em] text-faint uppercase">
              {profile.name} — 29.97°N · 32.55°E
            </p>
            <p className="mt-2 text-center font-mono text-[11px] tracking-[0.22em] text-faint uppercase">
              <SuezClock />
            </p>
          </div>
        </div>

        {/* ——— Counters band — ignited top beam ——— */}
        <div
          data-about-fade
          className={
            hasBirthdate
              ? "relative mt-20 grid grid-cols-2 border-y border-border lg:grid-cols-4"
              : "relative mt-20 flex justify-center border-y border-border"
          }
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_14px_rgba(255,61,0,0.6)]"
          />
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center transition-colors duration-300 hover:bg-accent/[0.04]">
            <CountUp
              end={3}
              className="display text-5xl font-bold text-accent tabular-nums sm:text-6xl"
            />
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
              {t.about.statsLangLabel}
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
              {t.about.statsLangSub}
            </span>
          </div>
          {personal.birthdate && <LiveCells birthISO={personal.birthdate} />}
        </div>

        {/* ——— Education ——— */}
        {hasEducation && (
          <div data-about-fade className="mx-auto mt-16 max-w-3xl">
            <h3 className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-foreground">
              <GraduationCap className="h-6 w-6 text-accent" aria-hidden="true" />
              {t.about.eduTitle}
            </h3>
            <ol className="mt-8">
              {personal.education.map((entry) => (
                <li
                  key={`${pick(entry.school)}-${entry.period}`}
                  className="relative flex gap-5 pb-2 last:pb-0"
                >
                  <span aria-hidden="true" className="flex flex-col items-center">
                    <span className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_rgba(255,61,0,0.6)]" />
                    <span className="w-px flex-1 bg-border" />
                  </span>
                  <div className="mb-8 flex-1 border border-border bg-surface/60 p-5 transition-all duration-300 last:mb-0 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_50px_-24px_var(--accent)] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-display text-xl font-bold text-foreground">
                        {pick(entry.school)}
                      </p>
                      <span className="border border-border px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                        {entry.period}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {t.about.eduFaculty}: {pick(entry.faculty)} · {t.about.eduDept}:{" "}
                      {pick(entry.department)}
                    </p>
                    <div className="mt-4 flex w-fit items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
                      {status.kind === "studying" ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-accent" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                        </span>
                      ) : (
                        <GraduationCap className="h-4 w-4 text-accent" aria-hidden="true" />
                      )}
                      <span className="text-sm font-bold text-foreground">
                        {status.kind === "studying" ? levelInfo?.label : t.about.graduatedLabel}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm text-muted italic">
                      “{status.kind === "studying" ? levelInfo?.motto : t.about.graduatedMotto}”
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="mt-10 text-center font-mono text-[11px] tracking-[0.18em] uppercase">
          <a
            href={`mailto:${profile.email}`}
            className="text-faint transition-colors duration-200 hover:text-accent"
          >
            {profile.email}
          </a>
        </p>
      </div>

      {/* Reverse stack ribbon — closes the section with motion */}
      <div
        aria-hidden="true"
        className="marquee-rev relative overflow-hidden border-t border-border py-2.5"
      >
        <div className="marquee-rev-track flex w-max items-center gap-6 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          {[...stackChips, ...stackChips].map((chip, i) => (
            <span
              key={i}
              className="flex items-center gap-6 font-mono text-[11px] tracking-[0.35em] whitespace-nowrap text-faint uppercase"
            >
              {chip}
              <span className="h-1 w-1 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
