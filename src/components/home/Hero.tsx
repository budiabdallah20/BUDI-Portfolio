"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code,
  Download,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  BadgeCheck,
} from "lucide-react";
import { heroCopy, profile, socialLinks, stackChips } from "@/data/portfolio";
import { techLogo } from "@/data/techLogos";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNow } from "@/hooks/useNow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTypewriter } from "@/hooks/useTypewriter";

interface HeroProps {
  /** Becomes true the moment the loading curtain lifts. */
  start: boolean;
  /** Dashboard-owned portrait — falls back to the baked-in photo. */
  image?: string;
}

interface RoleColor {
  bg: string;
  fg: string;
  glow: string;
  soft: string;
}

/** Approved museum foreground hues, independent of the role typing cycle. */
const ROLE_COLORS: RoleColor[] = [
  ...["#EF8585", "#91DDA9", "#85C4FF"].map(bg => ({ bg, fg: "#0D0D0C", glow: `${bg}33`, soft: `${bg}16` })),
];

type DayPart = "morning" | "afternoon" | "evening" | "night";

function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const DAY_ICON = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon } as const;

export default function Hero({ start, image }: HeroProps): React.JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { t, lang } = useLanguage();
  const fr = lang === "fr";
  const { text: typed, index: roleIndex } = useTypewriter(t.hero.roles.map((r) => r.title));
  const activeRole = t.hero.roles[roleIndex % t.hero.roles.length] ?? t.hero.roles[0];

  const [hueIndex, setHueIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let inView = true;
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    if (rootRef.current) observer.observe(rootRef.current);
    const timer = window.setInterval(() => { if (inView && document.visibilityState === "visible") setHueIndex(i => (i + 1) % ROLE_COLORS.length); }, 5000);
    return () => { clearInterval(timer); observer.disconnect(); };
  }, [reduced]);

  // Only foreground color changes; backgrounds and layout remain stable.
  const roleColor: RoleColor =
    ROLE_COLORS[(reduced ? 0 : hueIndex) % ROLE_COLORS.length] ?? ROLE_COLORS[0]!;

  // ——— Live Suez clock. Null pre-mount → static fallback, zero hydration mismatch ———
  const now = useNow(1000);
  const { hour, timeStr, iso } = useMemo(() => {
    if (!now) return { hour: null as number | null, timeStr: null as string | null, iso: "" };
    try {
      const hourFmt = new Intl.DateTimeFormat("en-GB", {
        hour: "numeric",
        hour12: false,
        timeZone: "Africa/Cairo",
      });
      const timeFmt = new Intl.DateTimeFormat(t.intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      });
      const parsed = Number.parseInt(hourFmt.format(now), 10);
      return {
        hour: Number.isNaN(parsed) ? null : parsed,
        timeStr: timeFmt.format(now),
        iso: now.toISOString(),
      };
    } catch {
      return { hour: null as number | null, timeStr: null as string | null, iso: "" };
    }
  }, [now, t.intlLocale]);
  const part: DayPart | null = hour === null ? null : dayPartForHour(hour);
  const DayIcon = part ? DAY_ICON[part] : null;
  const dayLabel = part ? t.hero.dayParts[part] : null;
  /** Dashboard-owned portrait wins — baked-in photo is the fallback. */
  const heroImage = image && image.trim() !== "" ? image : "/images/general/hero.jpg";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      gsap.set(root.querySelectorAll(".atrium-portrait"), { clearProps: "all", opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      if (!start) {
        gsap.set(".atrium-portrait", { autoAlpha: 1, y: 0 });
        gsap.set("[data-hero-scroll]", { autoAlpha: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      // fromTo (not to): cleanup reverts the pre-hidden state, so the
      // entrance must declare its own starting values to actually play.
      tl.fromTo(
        ".atrium-portrait",
        { autoAlpha: 1, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.035,
        },
      ).fromTo("[data-hero-scroll]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, "-=0.3");
    }, root);

    return (): void => {
      ctx.revert();
    };
  }, [start, reduced]);

  /** Cursor spotlight — direct CSS-var writes, no re-renders. Fine pointer only. */
  const pointerFrame = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
  }, []);
  const onSpotMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (pointerFrame.current !== null) return;
    pointerFrame.current = requestAnimationFrame(() => {
      pointerFrame.current = null;
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${pointer.current.x - rect.left}px`);
      el.style.setProperty("--my", `${pointer.current.y - rect.top}px`);
    });
  };

  return (
    <section
      ref={rootRef}
      id="home"
      aria-labelledby="hero-heading"
      onMouseMove={onSpotMove}
      className="hero-museum relative flex min-h-svh items-center overflow-clip"
    >
      <div className="refined-temple" aria-hidden="true">
        <svg viewBox="0 0 1440 850" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="temple-stone" x2="1" y2="0"><stop stopColor="#0b0908"/><stop offset=".55" stopColor="#2b2016"/><stop offset="1" stopColor="#120e0b"/></linearGradient>
            <pattern id="temple-carving" width="30" height="48" patternUnits="userSpaceOnUse"><path d="M8 4v36m7-34v20m7-22v36M3 44h24" fill="none" stroke="#d8ad61" strokeOpacity=".23"/></pattern>
          </defs>
          <g fill="url(#temple-stone)" stroke="#c89648" strokeOpacity=".35">
            <path d="M740 625 763 240h433l38 385zM806 598l17-314h319l20 314z" fillRule="evenodd"/>
            <path d="M664 690l42-542h553l52 542zM752 638l28-404h401l35 404z" fillRule="evenodd"/>
            <path d="M558 773 620 54h746l61 719zM686 682l40-529h532l48 529z" fillRule="evenodd"/>
            <path d="M610 94h766l-6-32H614zM698 174h568l8 28H694z"/>
            <path d="M572 769h855v22H563zM643 728h723v18H632zM709 686h601v15H700z"/>
          </g>
          <path d="M631 113h51l-47 581h-58zM1296 113h47l51 581h-58z" fill="url(#temple-carving)"/>
          <path d="M935 116q54-58 108 0m-82 0 28-29 28 29m-82 0h-53m161 0h53" fill="none" stroke="#d4af37" strokeOpacity=".6"/>
          <path d="M767 686 450 850m760-164 178 164M895 683l-112 167m273-167 44 167" fill="none" stroke="#d4af37" strokeOpacity=".23"/>
        </svg>
        <span className="refined-temple-haze" />
      </div>
      <span className="refined-pointer-light" aria-hidden="true" style={{ "--pointer-hue": roleColor.soft } as React.CSSProperties} />
      <div className="atrium-layout relative mx-auto grid w-full max-w-7xl gap-12 px-5 pt-28 pb-24 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-36">
        {/* ——— Content ——— */}
        <div className="flex flex-col justify-center lg:col-span-7">
          {/* Time-aware greeting — day-part glows in the active role color, clock stays live */}
          <p
            data-hero-reveal
            className="eyebrow flex min-h-[1.5rem] flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm"
          >
            {dayLabel != null && DayIcon != null ? (
              <>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  {!reduced && (
                    <span
                      className="animate-ping-soft absolute inline-flex h-full w-full rounded-full"
                      style={{ backgroundColor: roleColor.bg }}
                    />
                  )}
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: roleColor.bg, boxShadow: `0 0 8px ${roleColor.glow}` }}
                  />
                </span>
                <span
                  className="inline-flex items-center gap-1.5 font-semibold transition-colors duration-500"
                  style={{ color: roleColor.bg, textShadow: `0 0 18px ${roleColor.glow}` }}
                >
                  <DayIcon className="h-4 w-4" aria-hidden="true" />
                  {dayLabel}
                </span>
                <span aria-hidden="true" className="text-faint">
                  ·
                </span>
              </>
            ) : null}
            <span className="text-muted">{t.hero.greeting}</span>
            {timeStr != null ? (
              <span className="text-faint tabular-nums" suppressHydrationWarning>
                {" "}
                ·{" "}
                <time dateTime={iso} title={t.bar.timeLabel}>
                  {timeStr} {t.hero.inSuez}
                </time>
              </span>
            ) : null}
          </p>

          <h1
            id="hero-heading" tabIndex={-1}
            data-hero-reveal
            className="display mt-3 text-[clamp(2.6rem,8.5vw,5.5rem)] font-bold text-foreground"
          >
            {profile.name}
          </h1>

          {/* Rotating profession line — fixed height guards against CLS, color follows the role */}
          <p
            data-hero-reveal
            className="mt-4 flex min-h-[2.75rem] items-center text-[clamp(1.35rem,3.4vw,2.1rem)] sm:min-h-[3.25rem]"
          >
            <span
              className="display font-bold transition-colors duration-500"
              style={{ color: roleColor.bg, textShadow: `0 0 26px ${roleColor.glow}` }}
              aria-hidden="true"
            >
              {typed}
              <span className="animate-pulse" aria-hidden="true">
                |
              </span>
            </span>
            <span className="sr-only">{activeRole.title}</span>
          </p>

          {/* Bio follows the active role — fixed height guards against CLS */}
          <div data-hero-reveal className="atrium-bio mt-5 min-h-[8rem] max-w-xl sm:min-h-[6rem]" style={{ "--atrium-hue": roleColor.bg } as React.CSSProperties}>
            {reduced ? (
              <p className="text-base leading-relaxed text-muted sm:text-lg">{activeRole.bio}</p>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={roleIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="text-base leading-relaxed text-muted sm:text-lg"
                >
                  {activeRole.bio}
                </motion.p>
              </AnimatePresence>
            )}
          </div>

          {/* Role position dots — decorative progress for the cycler */}
          <div data-hero-reveal className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {t.hero.roles.map((_, i) => {
              const active = i === roleIndex % t.hero.roles.length;
              return (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={
                    active
                      ? {
                          width: 22,
                          backgroundColor: roleColor.bg,
                          boxShadow: `0 0 10px ${roleColor.glow}`,
                        }
                      : { width: 6, backgroundColor: "var(--border-strong)" }
                  }
                />
              );
            })}
          </div>

          <div data-hero-reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={heroCopy.primaryCta.href} className="hero-glass-action hero-glass-hire">
              <span>{t.hero.hireMe}</span><ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a href={heroCopy.secondaryCta.href} className="hero-glass-action hero-glass-projects">
              <span>{t.hero.explore}</span><ArrowRight size={17} aria-hidden="true" />
            </a>
            <a
              href={heroCopy.tertiaryCta.href}
              download
              className="group flex items-center justify-center gap-2.5 px-2 py-3 text-sm font-semibold text-muted transition-colors duration-200 hover:text-accent"
            >
              <span className="flex h-9 w-9 items-center justify-center border border-border transition-colors duration-200 group-hover:border-accent">
                <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              </span>
              {t.hero.downloadCv}
            </a>
          </div>

          {/* Quick trust features — two at-a-glance signals of meticulous work */}
          <div data-hero-reveal className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-emerald-300 uppercase">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {fr ? "Disponible · réponse < 24h" : "Available · replies < 24h"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-cyan-300 uppercase">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {fr ? "Site vérifié & sécurisé" : "Verified & secure site"}
            </span>
          </div>

          <div data-hero-reveal className="mt-9 flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.25em] text-faint uppercase">
              {t.hero.follow}
            </span>
            <span className="h-px w-10 bg-border" aria-hidden="true" />
            <ul className="social-gold-rail" aria-label={t.hero.socials}>
              {socialLinks.map(({ label, href, badgeColor, image, icon: Icon, bleachGlyph, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    style={{ "--social-brand": badgeColor } as React.CSSProperties} data-social-vitrine=""
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        width={18}
                        height={18}
                        className={bleachGlyph ? "glyph-white h-[18px] w-[18px]" : "block h-[18px] w-[18px]"}
                      />
                    ) : Icon ? (
                      <Icon className="h-[18px] w-[18px]" />
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ——— Portrait ——— */}
        <div data-hero-reveal className="atrium-portrait flex items-center lg:col-span-5">
          <figure className="hero-photo-card">
            <div className="hero-photo-card-media">
              <SmartImage src={heroImage} alt={t.hero.photoAlt} fill priority quality={75} sizes="(max-width: 767px) 86vw, 480px" className="object-cover" />
            </div>
            <figcaption className="hero-photo-card-caption"><Code size={17} aria-hidden="true"/><span><strong>{profile.name}</strong><small>{t.hero.roles[0]?.title} · {t.hero.location}</small></span></figcaption>
          </figure>
        </div>

        {/* ——— Tech marquee ——— */}
        <div
          data-hero-reveal
          className="marquee relative overflow-hidden border-y border-border py-3.5 lg:col-span-12"
          aria-hidden="true"
        >
          <div className="marquee-track flex w-max items-stretch gap-3 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            {[...stackChips, ...stackChips].map((chip, i) => {
              const logo = techLogo(chip);
              return (
                <span key={i} className="flex items-center gap-3">
                  <span className="flex min-w-[92px] flex-col items-center gap-1.5 border border-border bg-surface/60 px-4 py-2.5">
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={22}
                        height={22}
                        loading="lazy"
                        className="block h-[22px] w-[22px]"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="block h-[22px] w-[22px] rounded-full bg-accent"
                      />
                    )}
                    <span className="font-mono text-[11px] tracking-[0.14em] whitespace-nowrap text-muted uppercase">
                      {chip}
                    </span>
                  </span>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-accent" />
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <a
        href="#about"
        data-hero-scroll
        aria-label={t.hero.scrollNext}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-faint uppercase">
          {t.hero.scroll}
        </span>
        <span className="flex h-10 w-6 justify-center border border-border pt-2">
          {!reduced && <span className="animate-scroll-wheel h-2 w-1 rounded-full bg-accent" />}
        </span>
        <ArrowDown className="h-3.5 w-3.5 text-faint" />
      </a>
    </section>
  );
}
