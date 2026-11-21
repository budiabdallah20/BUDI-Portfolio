"use client";

import { Clock3, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import type { Lang } from "@/i18n/dictionaries";
import { type SiteAvailability, workDeadlineSuffix, workLabel } from "@/components/WorkStatus";

const timezone = "Africa/Cairo";
const words = {
  en: { hello:"Hello", sunrise:"Good morning", afternoon:"Good afternoon", evening:"Good evening", night:"Good night", cairo:"Cairo time", available:"Available for work", unavailable:"Currently unavailable" },
  fr: { hello:"Bonjour", sunrise:"Bonjour", afternoon:"Bon après-midi", evening:"Bonsoir", night:"Bonne nuit", cairo:"Heure du Caire", available:"Disponible pour travailler", unavailable:"Indisponible actuellement" },
} as const;
const greetingIcons = { hello: Sun, sunrise: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };

export function HeroGreeting({ locale }: { locale: Lang }) {
  const now = useNow();
  const text = words[locale];
  const hour = now && Number(new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "2-digit", hourCycle:"h23" }).format(now));
  const part = hour === null ? "hello" : hour < 5 || hour >= 22 ? "night" : hour < 12 ? "sunrise" : hour < 17 ? "afternoon" : "evening";
  const Icon = greetingIcons[part];
  return <div className="hero-greeting-clock">
    <p className="editorial-greeting" data-period={part} key={part}>
      <span className="hero-greeting-icon"><Icon size={17} aria-hidden="true" /></span>
      <span className="editorial-greeting-label">{text[part]}</span>
    </p>
    {now && <time dateTime={now.toISOString()} title={text.cairo}><Clock3 size={15} aria-hidden="true" />
      {new Intl.DateTimeFormat(locale, { timeZone: timezone, hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(now)}
      <span>{text.cairo}</span>
    </time>}
  </div>;
}

export function HeroPresence({ locale, availability }: { locale: Lang; availability: SiteAvailability }) {
  const text = words[locale];
  const label = workLabel(availability, locale, text);
  return <div className="hero-availability" data-available={availability.status === "available"}>
    <span className="hero-presence-icon" aria-hidden="true" />
    <strong>{label}{workDeadlineSuffix(availability, locale)}</strong>
  </div>;
}
