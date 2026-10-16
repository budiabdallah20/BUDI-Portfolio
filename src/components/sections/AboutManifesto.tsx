"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Crown, Trophy } from "lucide-react";
import Image from "next/image";
import CountUp from "@/components/CountUp";
import { BritainFlag, EgyptFlag, FranceFlag } from "@/components/Flags";
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
    clubs: [
      {
        id: "ahly",
        name: "Al Ahly SC",
        short: "AHLY",
        tag: "Cairo · Red Devils",
        motto: "Club of the Century — Africa's crown",
        titles: "45+ Leagues · 12 CAF Champions",
      },
      {
        id: "barca",
        name: "FC Barcelona",
        short: "BARÇA",
        tag: "Catalunya · Blaugrana",
        motto: "Més que un club — more than a club",
        titles: "La Liga · UCL nights",
      },
    ],
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
    clubs: [
      {
        id: "ahly",
        name: "Al Ahly SC",
        short: "AHLY",
        tag: "Le Caire · Diables Rouges",
        motto: "Club du siècle — la couronne d'Afrique",
        titles: "45+ Championnats · 12 LDC CAF",
      },
      {
        id: "barca",
        name: "FC Barcelona",
        short: "BARÇA",
        tag: "Catalogne · Blaugrana",
        motto: "Més que un club — plus qu'un club",
        titles: "La Liga · Soirées UCL",
      },
    ],
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
          {t.stats.map((stat, si) => (
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
              {/* Flag under each language */}
              {si === 0 && (
                <span className="mt-2.5 flex items-center gap-2">
                  <span className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5" title="Arabic">
                    <EgyptFlag />
                    <span className="font-mono text-[8px] tracking-[0.2em] text-muted uppercase">AR</span>
                  </span>
                  <span className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5" title="English">
                    <BritainFlag />
                    <span className="font-mono text-[8px] tracking-[0.2em] text-muted uppercase">EN</span>
                  </span>
                  <span className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5" title="French">
                    <FranceFlag />
                    <span className="font-mono text-[8px] tracking-[0.2em] text-muted uppercase">FR</span>
                  </span>
                </span>
              )}
              {/* Logo of each core-stack language */}
              {si === 1 && (
                <span className="mt-2.5 flex items-center gap-2">
                  {[
                    { src: "/icons/tech/react.svg", label: "React" },
                    { src: "/icons/tech/nextjs.svg", label: "Next.js" },
                    { src: "/icons/tech/typescript.svg", label: "TS" },
                  ].map((tech) => (
                    <span key={tech.label} title={tech.label} className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                      <Image src={tech.src} alt="" width={20} height={20} loading="lazy" className="block h-5 w-5 object-contain" />
                      <span className="font-mono text-[8px] tracking-[0.14em] text-muted uppercase">{tech.label}</span>
                    </span>
                  ))}
                </span>
              )}
              {/* Logos of the social channels */}
              {si === 2 && (
                <span className="mt-2.5 flex max-w-full flex-wrap items-center justify-center gap-1.5">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.external ? "_blank" : undefined}
                      rel={s.external ? "noreferrer" : undefined}
                      title={s.label}
                      aria-label={s.label}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50"
                      style={{ backgroundColor: s.badgeColor }}
                    >
                      {s.image ? (
                        <Image src={s.image} alt="" width={14} height={14} loading="lazy" className="block h-3.5 w-3.5 object-contain brightness-0 invert" />
                      ) : null}
                    </a>
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Off keyboard — the two clubs in their own colors */}
        <div data-manifesto-fade className="mt-10">
          <p className="flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.22em] text-faint uppercase">
            <Trophy className="h-3.5 w-3.5 text-[#d4af37]" aria-hidden="true" />
            {t.off}
          </p>
          <div className="mx-auto mt-5 grid max-w-3xl gap-4 sm:grid-cols-2">
            {t.clubs.map((club) => {
              const ahly = club.id === "ahly";
              return (
                <div
                  key={club.id}
                  className="group relative overflow-hidden rounded-3xl border p-[1.5px] transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: ahly
                      ? "linear-gradient(135deg, #e63329, #7a0803 60%, #d4af37)"
                      : "linear-gradient(135deg, #a50044, #004d98 60%, #ffdf00)",
                    boxShadow: ahly
                      ? "0 18px 50px -20px rgba(230,51,41,0.55)"
                      : "0 18px 50px -20px rgba(0,77,152,0.6)",
                  }}
                >
                  {/* Club-colored face */}
                  <div
                    className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] p-5"
                    style={{
                      background: ahly
                        ? "linear-gradient(160deg, #1a0505 0%, #2b0a06 55%, #0b0b0c 100%)"
                        : "linear-gradient(160deg, #160a12 0%, #0a1030 55%, #0b0b0c 100%)",
                    }}
                  >
                    {/* Magic shine sweep */}
                    <span aria-hidden="true" className="club-shine pointer-events-none absolute inset-y-0 left-0 w-1/2" />
                    {/* Floating sparkles */}
                    <span aria-hidden="true" className="club-spark absolute top-6 right-16 h-1 w-1 rounded-full" style={{ background: ahly ? "#ffb3a6" : "#ffd75e" }} />
                    <span aria-hidden="true" className="club-spark club-spark-2 absolute bottom-10 left-10 h-1.5 w-1.5 rounded-full" style={{ background: ahly ? "#d4af37" : "#9fd0f5" }} />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-5 -right-3 text-[4.5rem] leading-none font-black text-transparent select-none"
                      style={{
                        WebkitTextStroke: ahly ? "1px rgba(230,51,41,0.4)" : "1px rgba(255,223,0,0.35)",
                      }}
                    >
                      {club.short}
                    </span>
                    {/* Distinctive mark */}
                    <span
                      className="absolute top-4 right-4 flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.18em] uppercase"
                      style={
                        ahly
                          ? { background: "rgba(230,51,41,0.16)", color: "#ff8a7a", border: "1px solid rgba(230,51,41,0.45)" }
                          : { background: "rgba(0,77,152,0.25)", color: "#9fd0f5", border: "1px solid rgba(0,77,152,0.6)" }
                      }
                    >
                      <Crown className="h-3 w-3" aria-hidden="true" />
                      {ahly ? (lang === "fr" ? "Siècle" : "Century") : "1899"}
                    </span>
                    <div className="relative flex items-center gap-4">
                      <span
                        className="crest-float flex shrink-0 items-center justify-center rounded-2xl bg-black/50 p-2.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                        style={{
                          border: ahly ? "1px solid rgba(230,51,41,0.6)" : "1px solid rgba(255,223,0,0.45)",
                          filter: ahly
                            ? "drop-shadow(0 0 16px rgba(230,51,41,0.5))"
                            : "drop-shadow(0 0 16px rgba(0,77,152,0.6))",
                        }}
                      >
                        <Image
                          src={ahly ? "/icons/egypt_al-ahly.football-logos.cc.svg" : "/icons/spain_barcelona.football-logos.cc.svg"}
                          alt={ahly ? "Al Ahly SC official crest" : "FC Barcelona official crest"}
                          width={56}
                          height={64}
                          loading="lazy"
                          className="block h-16 w-14 object-contain"
                        />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="font-mono text-[9px] tracking-[0.3em] uppercase"
                          style={{ color: ahly ? "#ff9d8a" : "#ffd75e" }}
                        >
                          {club.tag}
                        </p>
                        <p className="font-display mt-0.5 truncate text-xl font-black tracking-tight text-foreground">
                          {club.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted italic">{club.motto}</p>
                      </div>
                    </div>
                    <p className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] tracking-[0.16em] text-faint uppercase">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: ahly ? "#e63329" : "#ffdf00",
                            boxShadow: ahly ? "0 0 8px rgba(230,51,41,0.9)" : "0 0 8px rgba(255,223,0,0.9)",
                          }}
                          aria-hidden="true"
                        />
                        {club.titles}
                      </span>
                      <span className="font-black" style={{ color: ahly ? "#ffb3a6" : "#ffd75e" }}>
                        {club.short}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* BUDI under the clubs — light creative shimmer */}
          <p aria-hidden="true" className="mt-6 text-center select-none">
            <span className="budi-shimmer font-display text-3xl font-black tracking-[0.35em] uppercase sm:text-4xl">
              BUDI
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
