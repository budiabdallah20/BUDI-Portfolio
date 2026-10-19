"use client";

import { useMemo } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Sun,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Logo from "@/components/Logo";
import { useNow } from "@/hooks/useNow";
import { useWeather } from "@/hooks/useWeather";
import { profile } from "@/data/portfolio";
import type { WeatherGroup } from "@/i18n/dictionaries";
import type { SiteAvailability } from "@/components/WorkStatus";
import { workDeadlineSuffix, workLabel } from "@/components/WorkStatus";

const GROUP_ICON = {
  clear: Sun,
  partly: CloudSun,
  overcast: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
} as const;

/**
 * Slim status strip above the navbar: live Cairo clock, localized date,
 * real Suez weather, location and availability. Hidden on small screens
 * where every pixel belongs to content.
 */
export default function UtilityBar({
  availability,
}: {
  availability?: SiteAvailability;
}): React.JSX.Element {
  const { t, lang } = useLanguage();
  const now = useNow(1000);
  const weather = useWeather();
  /** Dashboard-owned availability — flips with the master switch. */
  const avail: SiteAvailability = availability ?? { status: "available", note: "", noteFr: "", until: "" };
  const availLabel =
    workLabel(avail, lang, {
      available: t.hero.available,
      unavailable: t.hero.unavailable,
    }) + workDeadlineSuffix(avail, lang);
  const availLive = avail.status === "available";

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(t.intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      }),
    [t.intlLocale],
  );
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(t.intlLocale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Africa/Cairo",
      }),
    [t.intlLocale],
  );

  const VERSES = [
    { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", tr: "With hardship comes ease" },
    { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", tr: "My Lord, increase me in knowledge" },
    { ar: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ", tr: "My success is only through Allah" },
  ];
  const verse = VERSES[Math.floor((now?.getMinutes() ?? 0) / 20) % VERSES.length];
  const WeatherIcon: typeof Cloud = weather ? GROUP_ICON[weather.group as WeatherGroup] : Cloud;
  const weatherText = weather
    ? `${weather.tempC}°C ${t.bar.weather[weather.group as WeatherGroup]}`
    : t.bar.unavailable;

  return (
    <div className="hidden border-b border-border/70 md:block">
      <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between gap-3 px-5 font-mono text-[11px] tracking-[0.14em] uppercase sm:px-8">
        <p className="flex items-center gap-2 text-faint">
          <span className="chip chip-time">
            <time
              dateTime={now?.toISOString() ?? ""}
              title={t.bar.timeLabel}
              className="tabular-nums"
              suppressHydrationWarning
            >
              {now ? timeFmt.format(now) : "--:--:--"}
            </time>
          </span>
          <span suppressHydrationWarning>{now ? dateFmt.format(now) : "--"}</span>
        </p>

        {/* Center: Quranic verse + wisdom + Egyptian flag — in a small pulsing glass card */}
        <span className="quran-glass relative inline-flex items-center gap-2.5 rounded-xl border border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/10 via-[#ff3d00]/8 to-[#a78bfa]/10 px-3 py-1 backdrop-blur-md">
          <span aria-hidden="true" className="quran-glass-glow" />
          <span
            dir="rtl"
            lang="ar"
            className="relative text-[11px] leading-none text-[#e9ce7a]"
            title={verse.tr}
          >
            {verse.ar}
          </span>
          <span className="relative text-[10px] tracking-[0.14em] text-faint/90 normal-case">
            No risk, no story
          </span>
          <span
            aria-label="Egypt"
            title="Egypt"
            className="egypt-flag relative inline-flex h-4 w-6 overflow-hidden rounded-[3px] border border-white/20 shadow-[0_0_8px_rgba(206,17,38,0.4)]"
          >
            <span className="absolute inset-x-0 top-0 h-1/3 bg-[#CE1126]" />
            <span className="absolute inset-x-0 top-1/3 h-1/3 bg-white" />
            <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[#000000]" />
            <svg
              viewBox="0 0 60 40"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <g transform="translate(30,20)" fill="#C9A227">
                <path d="M0,-6 L1.5,-2 L5,-2 L2.5,0.5 L3.5,4 L0,2 L-3.5,4 L-2.5,0.5 L-5,-2 L-1.5,-2 Z" />
              </g>
            </svg>
          </span>
        {/* BUDI verification badge — site logo seal */}
        <span
          aria-label="BUDI verified"
          title="BUDI verified site"
          className="relative inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d4af37] via-[#ff3d00] to-[#a78bfa] shadow-[0_0_10px_rgba(212,175,55,0.6)] ring-1 ring-white/20"
        >
          <span className="absolute inset-0 flex items-center justify-center scale-[0.34] origin-center drop-shadow-[0_0_6px_rgba(212,175,55,0.8)]">
            <Logo variant="mark" />
          </span>
        </span>
        </span>

        <p className="flex items-center gap-2.5 text-faint">
          <span
            role="img"
            aria-label={`${t.bar.weatherLabel}: ${weatherText}`}
            title={`${t.bar.weatherLabel}: ${weatherText}`}
            className="chip chip-weather"
          >
            <WeatherIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">
              {weather ? `${weather.tempC}°C` : "--"}
            </span>
          </span>
          <a
            href={profile.locationHref}
            target="_blank"
            rel="noreferrer"
            className="chip chip-loc transition-opacity hover:opacity-80"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t.hero.location}
          </a>
          <span className="flex max-w-64 items-center gap-1.5" title={availLabel}>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${availLive ? "bg-accent" : "bg-amber-400"}`}
              aria-hidden="true"
            />
            <span className="truncate">{availLabel}</span>
          </span>
        </p>
      </div>
    </div>
  );
}
