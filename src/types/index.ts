import type { LucideIcon } from "lucide-react";
import type { NavId } from "@/i18n/dictionaries";

/** Section anchors — human labels live in the i18n dictionary. */
export interface NavLink {
  href: string;
  id: NavId;
}

export interface SocialLink {
  label: string;
  href: string;
  /** Badge background in the brand's original color. */
  badgeColor: string;
  /** File-based brand glyph (preferred) with generic Lucide fallback. */
  image?: string;
  icon?: LucideIcon;
  /** Bleach a black glyph to white for dark badges (multicolor files excluded). */
  bleachGlyph?: boolean;
  /** Fill a Lucide outline glyph solid (e.g. the YouTube play triangle). */
  solidGlyph?: boolean;
  external?: boolean;
}

export interface EducationEntry {
  school: LocalizedText;
  faculty: LocalizedText;
  department: LocalizedText;
  period: string;
}

export interface LocalizedText {
  en: string;
  fr: string;
}

export interface PersonalInfo {
  /** ISO birthdate "YYYY-MM-DD" — powers live age counters. Null hides them. */
  birthdate: string | null;
  /** Empty array hides the timeline until real entries are added. */
  education: EducationEntry[];
}

/** CTA copy lives in the i18n dictionary — data holds destinations only. */
export interface HeroCopy {
  primaryCta: { href: string };
  secondaryCta: { href: string };
  tertiaryCta: { href: string };
}

export interface Profile {
  name: string;
  displayName: string;
  brand: string;
  locationHref: string;
  email: string;
  phoneDisplay: string;
  phoneHref: string;
}
