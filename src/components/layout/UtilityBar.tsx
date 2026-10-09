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

  const WeatherIcon: typeof Cloud = weather ? GROUP_ICON[weather.group as WeatherGroup] : Cloud;
  const weatherText = weather
    ? `${weather.tempC}°C ${t.bar.weather[weather.group as WeatherGroup]}`
    : t.bar.unavailable;

  return (
    <div className="hidden border-b border-border/70 md:block">
      <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-5 font-mono text-[11px] tracking-[0.14em] uppercase sm:px-8">
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
