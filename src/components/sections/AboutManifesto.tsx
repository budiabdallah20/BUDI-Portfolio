"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Trophy } from "lucide-react";
import CountUp from "@/components/CountUp";
import { socialLinks, stackChips } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * AboutManifesto — statement band mounted right after <About/>.
 * Self-contained on purpose: inline EN/FR copy + own scroll selectors, so it
 * never collides with parallel work inside About.tsx.
 * Mount: <AboutManifesto /> in HomeShell after <About />.
 */
const COPY = {
  en: {
    sectionLabel: "Work philosophy",
    eyebrow: "Process / Delivery",
    line1: "I DON'T JUST",
    line2: "BUILD.",
    sub: "I turn ideas into fast, secure systems people love to use — interfaces, data and logic in one coherent architecture.",
    ghost: "SYSTEMS",
    rows: [
      {
        n: "01",
        title: "Web Experiences",
        desc: "Interfaces built to convert attention into action.",
        href: "#projects",
      },
      {
        n: "02",
        title: "Web Applications",
        desc: "From dashboards to complex workflows, designed around real user actions.",
        href: "#services",
      },
      {
        n: "03",
        title: "Secure by Default",
        desc: "Clean code, OWASP habits and performance budgets in every ship.",
        href: "#skills",
      },
    ],
    stats: [
      { value: 3, label: "Languages", sub: "Arabic · English · French" },
      { value: stackChips.length, label: "Core stack", sub: "React · Next.js · TS" },
      { value: socialLinks.length, label: "Channels", sub: "Find me anywhere" },
    ],
    off: "Off keyboard — Al Ahly & Barça",
  },
  fr: {
    sectionLabel: "Philosophie de travail",
    eyebrow: "Méthode / Livraison",
    line1: "JE NE FAIS PAS",
    line2: "QUE CODER.",
    sub: "Je transforme les idées en systèmes rapides et sécurisés que les gens adorent utiliser — interfaces, données et logique dans une architecture cohérente.",
    ghost: "SYSTÈMES",
    rows: [
      {
        n: "01",
        title: "Expériences Web",
        desc: "Des interfaces qui convertissent l'attention en action.",
        href: "#projects",
      },
      {
        n: "02",
        title: "Applications Web",
        desc: "Des dashboards aux workflows complexes, pensés pour l'utilisateur réel.",
        href: "#services",
      },
      {
        n: "03",
        title: "Sécurisé par défaut",
        desc: "Code propre, réflexes OWASP et budgets de performance à chaque livraison.",
        href: "#skills",
      },
    ],
    stats: [
      { value: 3, label: "Langues", sub: "Arabe · Anglais · Français" },
      { value: stackChips.length, label: "Stack principale", sub: "React · Next.js · TS" },
      { value: socialLinks.length, label: "Réseaux", sub: "Retrouvez-moi partout" },
    ],
    off: "Hors clavier — Al Ahly & Barça",
  },
} as const;

export default function AboutManifesto(): React.JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { lang } = useLanguage();
  const t = lang === "fr" ? COPY.fr : COPY.en;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-manifesto-fade]").forEach((el) => {
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

      gsap.fromTo(
        "[data-manifesto-row]",
        { autoAlpha: 0, x: -28 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-manifesto-rows]", start: "top 85%", once: true },
        },
      );
    }, root);

    return (): void => {
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      aria-label={t.sectionLabel}
      className="relative overflow-clip border-t border-border"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 50% 0%, rgba(215,253,68,0.07), transparent 65%)",
        }}
      />
      {/* Giant ghost word */}
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-10 -left-4 hidden text-[16vw] leading-none opacity-15 select-none lg:block"
      >
        {t.ghost}
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <p
          data-manifesto-fade
          className="font-mono text-xs tracking-[0.35em] text-faint uppercase"
        >
          {t.eyebrow}
        </p>

        <h2 data-manifesto-fade className="display mt-4 font-bold tracking-tight">
          <span className="block text-[clamp(2.4rem,7vw,5rem)] text-foreground">
            {t.line1}
          </span>
          <span
            aria-hidden="true"
            className="text-stroke block text-[clamp(2.4rem,7vw,5rem)]"
          >
            {t.line2}
          </span>
          <span className="sr-only">{`${t.line1} ${t.line2}`}</span>
        </h2>

        <p
          data-manifesto-fade
          className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {t.sub}
        </p>

        {/* Numbered capability rows */}
        <div data-manifesto-rows className="mt-12 border-t border-border">
          {t.rows.map((row) => (
            <a
              key={row.n}
              data-manifesto-row
              href={row.href}
              className="group relative flex items-center gap-5 border-b border-border py-6 transition-colors duration-300 hover:bg-accent/[0.04] sm:gap-8 sm:py-7"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 bg-accent transition-transform duration-500 group-hover:scale-y-100"
              />
              <span className="display w-12 shrink-0 text-xl font-bold text-faint transition-colors duration-300 group-hover:text-accent sm:w-16 sm:text-2xl">
                {row.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="display block text-2xl font-bold tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-1 sm:text-4xl">
                  {row.title}
                </span>
                <span className="mt-1 block truncate text-sm text-muted sm:text-base">
                  {row.desc}
                </span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted transition-all duration-300 group-hover:border-accent group-hover:text-accent">
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </a>
          ))}
        </div>

        {/* Data-derived stats */}
        <div
          data-manifesto-fade
          className="mt-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3"
        >
          {t.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 bg-background px-4 py-8 text-center"
            >
              <CountUp
                end={stat.value}
                className="display text-5xl font-bold text-accent tabular-nums"
              />
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
                {stat.label}
              </span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        <p
          data-manifesto-fade
          className="mt-8 flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.22em] text-faint uppercase"
        >
          <Trophy className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          {t.off}
        </p>
      </div>
    </section>
  );
}
