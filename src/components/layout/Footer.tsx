"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/Logo";
import { navLinks, profile, socialLinks, stackChips } from "@/data/portfolio";
import { TECH_STACK, techLogo } from "@/data/techLogos";
import { verseOfDay } from "@/data/verses";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNow } from "@/hooks/useNow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { SiteAvailability } from "@/components/WorkStatus";
import { workDeadlineSuffix, workLabel } from "@/components/WorkStatus";

const COPY = {
  en: {
    eyebrow: "The last frame",
    line1: "LET'S BUILD",
    line2: "SOMETHING THAT MATTERS.",
    sub: "Have an idea, a project, or a role in mind? My inbox is always open.",
    cta: "Start a Conversation",
    wisdom: "Ship work you're proud to sign.",
    verse: "And say: Work, and Allah will see your work.",
    verseRef: "Quran 9:105",
    navTitle: "Navigation",
    contactTitle: "Contact",
    socialsTitle: "Socials",
    copyEmail: "Copy email",
    copyNumber: "Copy number",
    copied: "Copied",
    whatsapp: "WhatsApp",
    call: "Call now",
    builtBy: "Designed & engineered by",
    rights: "All rights reserved.",
    top: "Back to top",
    status: "All systems operational",
  },
  fr: {
    eyebrow: "La dernière image",
    line1: "CONSTRUISONS",
    line2: "QUELQUE CHOSE QUI COMPTE.",
    sub: "Une idée, un projet ou un poste en tête ? Ma boîte mail est toujours ouverte.",
    cta: "Démarrer une conversation",
    wisdom: "Livrez un travail que vous êtes fier de signer.",
    verse: "Et dis : Agissez, et Allah verra vos actes.",
    verseRef: "Coran 9:105",
    navTitle: "Navigation",
    contactTitle: "Contact",
    socialsTitle: "Réseaux",
    copyEmail: "Copier l'e-mail",
    copyNumber: "Copier le numéro",
    copied: "Copié",
    whatsapp: "WhatsApp",
    call: "Appeler",
    builtBy: "Conçu & réalisé par",
    rights: "Tous droits réservés.",
    top: "Retour en haut",
    status: "Tous les systèmes sont opérationnels",
  },
} as const;

/**
 * Footer — Tito-grade finale, BUDI voice: giant CTA, wisdom line,
 * Quranic verse (Arabic + translation), sitemap, live contact card,
 * socials and a smart bottom bar. Self-contained bilingual copy.
 */
export default function Footer({
  email,
  availability,
}: {
  email?: string;
  availability?: SiteAvailability;
}): React.JSX.Element {
  const { lang, t } = useLanguage();
  const reduced = useReducedMotion();
  /** Dashboard-owned availability — flips with the master switch. */
  const avail: SiteAvailability = availability ?? { status: "available", note: "", noteFr: "", until: "" };
  const availLabel =
    workLabel(avail, lang, {
      available: t.hero.available,
      unavailable: t.hero.unavailable,
    }) + workDeadlineSuffix(avail, lang);
  const availLive = avail.status === "available";
  const now = useNow(1000);
  const [copied, setCopied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const c = lang === "fr" ? COPY.fr : COPY.en;
  const year = new Date().getFullYear();
  /** Dashboard-owned contact email wins — portfolio address is the fallback. */
  const contactEmail = email || profile.email;

  const suezTime = useMemo(() => {
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

  /** Daily verse — epoch fallback pre-mount so SSR and first paint match byte-for-byte. */
  const verse = useMemo(() => verseOfDay(now ?? new Date(0)), [now]);

  /** Fire the navbar ⌘K palette from the footer. */
  const openPalette = (): void => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  const copyEmail = (): void => {
    try {
      void navigator.clipboard?.writeText(contactEmail)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const copyPhone = (): void => {
    try {
      void navigator.clipboard?.writeText(profile.phoneDisplay)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopiedPhone(true);
    window.setTimeout(() => setCopiedPhone(false), 1600);
  };

  /** Magnetic pull for the finale CTA — direct DOM writes, no re-renders. */
  const onCtaMove = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ctaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${(dx * 0.15).toFixed(1)}px, ${(dy * 0.18).toFixed(1)}px)`;
  };
  const onCtaLeave = (): void => {
    if (ctaRef.current) ctaRef.current.style.transform = "";
  };

  return (
    <footer className="relative overflow-clip border-t border-border">
      {/* Magic top beam — light runs across the footer crown */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <span className="animate-bar-shine block h-full w-full bg-gradient-to-r from-transparent via-accent to-transparent" />
      </span>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,61,0,0.08), transparent 65%)",
        }}
      />
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-aurora-a pointer-events-none absolute top-[30%] left-[2%] h-[280px] w-[280px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(215,253,68,0.05) 0%, transparent 65%)" }}
          />
          <div
            aria-hidden="true"
            className="animate-aurora-b pointer-events-none absolute right-[3%] bottom-[5%] h-[260px] w-[260px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 65%)" }}
          />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-20 pb-8 sm:px-8">
        {/* ——— Arsenal marquee ——— */}
        <div
          aria-hidden="true"
          className="marquee relative mb-16 overflow-hidden border-y border-border py-3"
        >
          <div className="marquee-track flex w-max items-center gap-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            {[...stackChips, ...stackChips].map((chip, i) => {
              const logo = techLogo(chip);
              return logo ? (
                <Image
                  key={i}
                  src={logo}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  className="block h-5 w-5 opacity-60 transition-opacity duration-300 hover:opacity-100"
                />
              ) : null;
            })}
          </div>
        </div>

        {/* ——— Finale CTA ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <p
            title={availLabel}
            className={`flex max-w-full items-center gap-2.5 rounded-full border px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase ${
              availLive
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {!reduced && (
                <span
                  className={`animate-ping-soft absolute inline-flex h-full w-full rounded-full ${
                    availLive ? "bg-accent" : "bg-amber-400"
                  }`}
                />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  availLive ? "bg-accent" : "bg-amber-400"
                }`}
              />
            </span>
            <span className="truncate">{availLabel}</span>
          </p>
          <p className="mt-5 font-mono text-xs tracking-[0.35em] text-faint uppercase">
            {c.eyebrow}
          </p>
          <p className="display mt-4 font-black tracking-tight">
            <span className="load-shimmer block text-[clamp(2.2rem,7vw,5rem)]">
              {c.line1}
            </span>
            <span aria-hidden="true" className="text-stroke block text-[clamp(2.2rem,7vw,5rem)] drop-shadow-[0_0_28px_rgba(255,61,0,0.2)]">
              {c.line2}
            </span>
            <span className="sr-only">{`${c.line1} ${c.line2}`}</span>
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {c.sub}
          </p>
          <span className="relative mt-8 inline-flex rounded-sm p-[1.5px]">
            <span
              aria-hidden="true"
              className="animate-spin-conic absolute inset-[-70%] m-auto h-[240%] w-[45%] opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, #ff3d00 15%, #d7fd44 30%, transparent 45%, transparent 60%, #a78bfa 75%, transparent 90%)",
                filter: "blur(7px)",
              }}
            />
            <a
              ref={ctaRef}
              href={`mailto:${contactEmail}`}
              onMouseMove={onCtaMove}
              onMouseLeave={onCtaLeave}
              className="group relative inline-flex items-center gap-2 overflow-hidden bg-accent px-8 py-4 text-sm font-bold text-accent-foreground transition-all duration-200 hover:shadow-[0_16px_50px_-12px_var(--accent)]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-black/25 blur-md transition-transform duration-700 group-hover:translate-x-[380%]"
              />
              <span className="relative">{c.cta}</span>
              <ArrowUpRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </span>
        </motion.div>

        {/* ——— Link columns ——— */}
        <div className="mt-16 grid grid-cols-2 gap-10 border-t border-border pt-12 lg:grid-cols-4">
          <div className="group/brand relative col-span-2 lg:col-span-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-5 rounded-3xl opacity-0 blur-2xl transition-opacity duration-700 group-hover/brand:opacity-100"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 20% 20%, rgba(255,61,0,0.16), transparent 65%), radial-gradient(ellipse 50% 50% at 80% 90%, rgba(215,253,68,0.10), transparent 65%)",
              }}
            />
            <a href="#home" className="group relative inline-flex items-center gap-3" aria-label="BUDI — back to home">
              {/* Living logo — orbiting conic glow + breathing aura + play on hover */}
              <span className="relative flex h-12 w-12 items-center justify-center">
                {!reduced && (
                  <>
                    <span
                      aria-hidden="true"
                      className="animate-spin-conic absolute inset-0 rounded-full opacity-80"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, #ff3d00 18%, #d7fd44 38%, transparent 55%, transparent 70%, #a78bfa 85%, transparent 100%)",
                        filter: "blur(5px)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="animate-ping-soft absolute inset-1 rounded-full border border-accent/50"
                    />
                  </>
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-[3px] rounded-full bg-background shadow-[0_0_26px_rgba(255,61,0,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_38px_rgba(215,253,68,0.65)]"
                />
                <span className="relative transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Logo />
                </span>
              </span>
              <span className="leading-none">
                <span
                  className="font-display block text-2xl font-black tracking-tight"
                  style={{
                    background: "linear-gradient(100deg, #f4f4ef 20%, #d7fd44 50%, #ff3d00 80%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    filter: "drop-shadow(0 0 14px rgba(255,61,0,0.35))",
                  }}
                >
                  BUDI
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-[9px] tracking-[0.3em] text-accent uppercase">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Full-Stack Dev
                </span>
              </span>
            </a>
            <p className="relative mt-4 max-w-xs border-l-2 border-accent/60 pl-3 text-sm leading-relaxed text-muted italic transition-all duration-300 group-hover/brand:border-accent group-hover/brand:text-foreground/90 group-hover/brand:drop-shadow-[0_0_16px_rgba(255,61,0,0.25)]">
              {t.about.lede}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase tabular-nums" suppressHydrationWarning>
              <span className="relative flex h-1.5 w-1.5">
                {!reduced && (
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-accent" />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Suez, EG{suezTime ? ` · ${suezTime}` : ""}
            </p>
          </div>

          <nav aria-label={c.navTitle}>
            <p className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
              {c.navTitle}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link, i) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-accent"
                  >
                    <span aria-hidden="true" className="font-mono text-[10px] text-faint tabular-nums">
                      0{i + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-3"
                    />
                    {t.nav[link.id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
              {c.contactTitle}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span className="truncate" dir="ltr">{contactEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={profile.phoneHref}
                  className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
                >
                  <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span dir="ltr">{profile.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={profile.locationHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {t.hero.location}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="flex cursor-pointer items-center gap-2 text-muted transition-colors hover:text-accent"
                >
                  {copied ? (
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  {copied ? c.copied : c.copyEmail}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={copyPhone}
                  className="flex cursor-pointer items-center gap-2 text-muted transition-colors hover:text-accent"
                >
                  {copiedPhone ? (
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  {copiedPhone ? c.copied : c.copyNumber}
                </button>
              </li>
            </ul>
            {/* Instant hire — one tap to WhatsApp or a real call */}
            <div className="mt-4 flex gap-2">
              <a
                href="https://wa.me/201065228072"
                target="_blank"
                rel="noreferrer"
                aria-label={`${c.whatsapp} — ${profile.phoneDisplay}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25d366] px-3 py-2 text-xs font-black text-[#062d1a] shadow-[0_10px_28px_-12px_rgba(37,211,102,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {c.whatsapp}
              </a>
              <a
                href={profile.phoneHref}
                aria-label={`${c.call} — ${profile.phoneDisplay}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d7fd44] px-3 py-2 text-xs font-black text-[#2b3305] shadow-[0_10px_28px_-12px_rgba(215,253,68,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {c.call}
              </a>
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
              {c.socialsTitle}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.hero.socials}>
              {socialLinks.map(({ label, href, badgeColor, image, icon: Icon, bleachGlyph, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    style={{ backgroundColor: badgeColor }}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        width={16}
                        height={16}
                        loading="lazy"
                        className={bleachGlyph ? "glyph-white h-4 w-4" : "block h-4 w-4"}
                      />
                    ) : Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ——— Bottom bar ——— */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
            © {year} {profile.name} · {c.rights}
          </p>
          <div className="group/budi relative overflow-hidden rounded-full p-[1.5px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-10px_rgba(255,61,0,0.6)]">
            <span
              aria-hidden="true"
              className="animate-spin-conic absolute inset-[-80%] m-auto h-[220%] w-[40%] opacity-80"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, #ff3d00 20%, #d7fd44 40%, transparent 60%, transparent 75%, #38bdf8 90%, transparent 100%)",
                filter: "blur(4px)",
              }}
            />
            <p className="relative flex items-center gap-1.5 rounded-full bg-background/95 px-4 py-2 font-mono text-[11px] tracking-[0.14em] whitespace-nowrap uppercase backdrop-blur-md">
              <span className="text-faint">{c.builtBy}</span>
              <Heart className="h-3.5 w-3.5 fill-accent text-accent drop-shadow-[0_0_8px_rgba(255,61,0,0.9)] transition-transform duration-300 group-hover/budi:scale-125" aria-hidden="true" />
              <span
                className="font-black transition-all duration-300 group-hover/budi:drop-shadow-[0_0_14px_rgba(215,253,68,0.8)]"
                style={{
                  background: "linear-gradient(100deg, #d7fd44 10%, #ff3d00 55%, #a78bfa 90%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                BUDI
              </span>
              <span className="text-faint">·</span>
              <span className="text-accent">Next.js · TypeScript</span>
            </p>
          </div>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
            <span className="relative flex h-2 w-2">
              {!reduced && (
                <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {c.status}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openPalette}
              aria-label="Command palette"
              title="Command palette (Ctrl+K)"
              className="flex h-10 cursor-pointer items-center gap-1.5 border border-border px-3 font-mono text-[11px] text-muted transition-all duration-200 hover:border-accent hover:text-accent"
            >
              ⌘K
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
              aria-label={c.top}
              title={c.top}
              className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border text-muted transition-all duration-200 hover:border-accent hover:text-accent"
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ——— Verse ribbon — the very bottom ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center gap-2.5 border-t border-border pt-8 text-center"
        >
          <span aria-hidden="true" className="flex items-center gap-2.5">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-accent/70 sm:w-20" />
            <span className="h-1.5 w-1.5 rotate-45 bg-accent shadow-[0_0_10px_rgba(255,61,0,0.8)]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-accent/70 sm:w-20" />
          </span>
          <p className="font-display text-base font-bold text-foreground">
            &ldquo;{c.wisdom}&rdquo;
          </p>
          <p dir="rtl" lang="ar" className="rounded-xl border border-accent/20 bg-accent/[0.04] px-6 py-3 text-lg leading-loose text-accent shadow-[0_0_36px_rgba(255,61,0,0.12)] transition-all duration-500 hover:shadow-[0_0_44px_rgba(255,61,0,0.3)] sm:text-xl">
            {verse.ar}
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            &ldquo;{lang === "fr" ? verse.fr : verse.en}&rdquo; —{" "}
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{verse.ref}</span>
          </p>
        </motion.div>



        {/* Forged-with strip — the real stack behind this site, original marks */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface/40 px-6 py-6">
          <p className="text-center font-mono text-[10px] tracking-[0.35em] text-faint uppercase">
            {lang === "fr" ? "Forgé avec" : "Forged with"}
          </p>
          <div
            className="marquee relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
            aria-label={lang === "fr" ? "Technologies du site" : "Site technology stack"}
          >
            <div className="marquee-track flex w-max items-center gap-3">
              {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                <span
                  key={`${tech.name}-${i}`}
                  aria-hidden={i >= TECH_STACK.length ? true : undefined}
                  title={tech.name}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-background/70 px-4 py-2.5 transition-colors duration-300 hover:border-accent/50"
                >
                  <Image
                    src={tech.logo}
                    alt=""
                    width={22}
                    height={22}
                    loading="lazy"
                    className="block h-[22px] w-[22px] object-contain"
                  />
                  <span className="text-[13px] font-bold whitespace-nowrap text-foreground">
                    {tech.name}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
