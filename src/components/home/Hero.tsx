"use client";

import { useEffect, useMemo, useRef } from "react";
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

/** Per-role signature palette — ember-dark theme, orange leads. */
const ROLE_COLORS: RoleColor[] = [
  { bg: "#ff3d00", fg: "#1a0e05", glow: "rgba(255,61,0,0.55)", soft: "rgba(255,61,0,0.08)" },
  { bg: "#38bdf8", fg: "#082f49", glow: "rgba(56,189,248,0.55)", soft: "rgba(56,189,248,0.08)" },
  { bg: "#fb7185", fg: "#4c0519", glow: "rgba(251,113,133,0.55)", soft: "rgba(251,113,133,0.08)" },
  { bg: "#a78bfa", fg: "#2e1065", glow: "rgba(167,139,250,0.55)", soft: "rgba(167,139,250,0.08)" },
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
  const frameRef = useRef<HTMLDivElement>(null);
  const hireRef = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const { t } = useLanguage();
  const { text: typed, index: roleIndex } = useTypewriter(t.hero.roles.map((r) => r.title));
  const activeRole = t.hero.roles[roleIndex % t.hero.roles.length] ?? t.hero.roles[0];

  // ——— Role = Color: ember palette follows the active role ———
  const roleColor: RoleColor =
    ROLE_COLORS[roleIndex % ROLE_COLORS.length] ?? ROLE_COLORS[0]!;

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
      gsap.set(root.querySelectorAll("[data-hero-reveal]"), { clearProps: "all", opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      if (!start) {
        gsap.set("[data-hero-reveal]", { autoAlpha: 0, y: 28 });
        gsap.set("[data-hero-scroll]", { autoAlpha: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      // fromTo (not to): cleanup reverts the pre-hidden state, so the
      // entrance must declare its own starting values to actually play.
      tl.fromTo(
        "[data-hero-reveal]",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
        },
      ).fromTo("[data-hero-scroll]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, "-=0.3");
    }, root);

    return (): void => {
      ctx.revert();
    };
  }, [start, reduced]);

  /** Cursor spotlight — direct CSS-var writes, no re-renders. Fine pointer only. */
  const onSpotMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(event.clientX - rect.left).toFixed(0)}px`);
    el.style.setProperty("--my", `${(event.clientY - rect.top).toFixed(0)}px`);
  };

  /** Magnetic pull for the primary CTA — direct DOM writes, no re-renders. */
  const onHireMove = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = hireRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.22).toFixed(1)}px)`;
  };
  const onHireLeave = (): void => {
    if (hireRef.current) hireRef.current.style.transform = "";
  };

  /** Gentle pointer tilt for the portrait — direct DOM writes, no re-renders. */
  const onFrameMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
  };
  const onFrameLeave = (): void => {
    if (frameRef.current) frameRef.current.style.transform = "";
  };

  return (
    <section
      ref={rootRef}
      id="home"
      aria-labelledby="hero-heading"
      onMouseMove={onSpotMove}
      className="relative flex min-h-svh items-center overflow-clip"
    >
      {/* Backdrop — dark color-graded wash + grid + drifting lights */}
      <div className="hero-wash absolute inset-0" aria-hidden="true" />
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />
      {/* Cursor spotlight tinted by the active role */}
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(480px circle at var(--mx, 72%) var(--my, 22%), ${roleColor.soft}, transparent 65%)`,
          }}
        />
      )}
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-drift-a absolute top-[8%] right-[8%] h-[380px] w-[380px] rounded-full will-transform transition-[background] duration-700"
            style={{
              background: `radial-gradient(circle, ${roleColor.bg}22 0%, transparent 65%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="animate-drift-b absolute bottom-[5%] left-[2%] h-[320px] w-[320px] rounded-full will-transform"
            style={{
              background:
                "radial-gradient(circle, rgba(215,253,68,0.08) 0%, transparent 65%)",
            }}
          />
        </>
      )}
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute -right-6 top-16 hidden text-[22vw] leading-none opacity-[0.07] select-none lg:block"
      >
        B
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pt-28 pb-24 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-36">
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
                  className="inline-flex items-center gap-1.5 font-semibold transition-colors duration-700"
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
            id="hero-heading"
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
              className="display font-bold transition-colors duration-700"
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
          <div data-hero-reveal className="mt-5 min-h-[8rem] max-w-xl sm:min-h-[6rem]">
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
            <a
              ref={hireRef}
              href={heroCopy.primaryCta.href}
              onMouseMove={onHireMove}
              onMouseLeave={onHireLeave}
              className="group relative flex items-center justify-center gap-2 overflow-hidden bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:shadow-[0_12px_44px_-10px_var(--accent)]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-black/25 blur-md transition-transform duration-700 group-hover:translate-x-[380%]"
              />
              <span className="relative">{t.hero.hireMe}</span>
              <ArrowUpRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href={heroCopy.secondaryCta.href}
              className="group relative flex items-center justify-center gap-2 overflow-hidden border border-border-strong px-6 py-3.5 text-sm font-semibold text-foreground"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
              />
              <span className="relative transition-colors duration-300 group-hover:text-accent-foreground">
                {t.hero.explore}
              </span>
              <ArrowRight className="relative h-4 w-4 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-foreground" />
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

          <div data-hero-reveal className="mt-9 flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.25em] text-faint uppercase">
              {t.hero.follow}
            </span>
            <span className="h-px w-10 bg-border" aria-hidden="true" />
            <ul className="flex flex-wrap items-center gap-2" aria-label={t.hero.socials}>
              {socialLinks.map(({ label, href, badgeColor, image, icon: Icon, bleachGlyph, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    style={{ backgroundColor: badgeColor }}
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
        <div data-hero-reveal className="flex items-center max-lg:order-first lg:col-span-5">
          <div className="w-full [perspective:1200px]" onMouseMove={onFrameMove} onMouseLeave={onFrameLeave}>
            <div
              ref={frameRef}
              className="group relative transition-transform duration-200 ease-out will-change-transform"
            >
              {/* Offset echo layer */}
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-4 translate-y-4 rounded-3xl border border-accent/40 bg-accent/5"
              />
              {/* Photo */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface">
                <SmartImage
                  src={heroImage}
                  alt={t.hero.photoAlt}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 80vw, 420px"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                />
                {/* Inner hairline */}
                <div
                  aria-hidden="true"
                  className="absolute inset-3 rounded-[20px] border border-white/20"
                />
                {/* Periodic glare sweep — cinematic sheen every few seconds */}
                {!reduced && (
                  <span
                    aria-hidden="true"
                    className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                )}
                {/* Edge highlights ignite on hover — tinted by the active role */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 h-[3px] w-full origin-left scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100"
                  style={{ backgroundImage: `linear-gradient(to right, ${roleColor.bg}, transparent)` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[3px] w-full origin-right scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100"
                  style={{ backgroundImage: `linear-gradient(to left, ${roleColor.bg}, transparent)` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 h-full w-[3px] origin-top scale-y-0 rounded-full transition-transform duration-500 group-hover:scale-y-100"
                  style={{ backgroundImage: `linear-gradient(to bottom, ${roleColor.bg}, transparent)` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 h-full w-[3px] origin-bottom scale-y-0 rounded-full bg-gradient-to-t transition-transform duration-500 group-hover:scale-y-100"
                  style={{ backgroundImage: `linear-gradient(to top, ${roleColor.bg}, transparent)` }}
                />
                {/* Caption */}
                <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.22em] whitespace-nowrap text-white/90 uppercase">
                  {profile.name} — Suez, EG
                </p>
              </div>

              {/* Floating role badge — icon wears the active role color */}
              <motion.div
                animate={reduced || !start ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="glass absolute bottom-10 -left-3 flex items-center gap-2.5 border border-border px-4 py-2.5 sm:-left-7"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center transition-colors duration-700"
                  style={{ backgroundColor: roleColor.bg, color: roleColor.fg }}
                >
                  <Code className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold whitespace-nowrap text-foreground">
                  {t.hero.roles[0]?.title}
                </span>
              </motion.div>
            </div>
          </div>
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
