import {
  AtSign,
  Briefcase,
  Camera,
  FolderGit,
  Mail,
  MessageCircle,
  Music2,
  Play,
  Share2,
} from "lucide-react";
import type { HeroCopy, NavLink, PersonalInfo, Profile, SocialLink } from "@/types";

export const profile: Profile = {
  name: "Mohamed Abdallah",
  displayName: "MOHAMED ABDALLAH",
  brand: "BUDI",
  locationHref: "https://maps.google.com/?q=Suez,Egypt",
  email: "budiabdallah922@gmail.com",
  phoneDisplay: "01065228072",
  phoneHref: "tel:+201065228072",
};

/** Nav is data-driven so future phases only append entries here. */
export const navLinks: NavLink[] = [
  { href: "#home", id: "home" },
  { href: "#about", id: "about" },
  { href: "#services", id: "services" },
  { href: "#projects", id: "projects" },
  { href: "#skills", id: "skills" },
  { href: "#certificates", id: "certificates" },
  { href: "#contact", id: "contact" },
];

export const heroCopy: HeroCopy = {
  primaryCta: { href: "#contact" },
  secondaryCta: { href: "#projects" },
  tertiaryCta: { href: "/documents/cv.html" },
};

/** Only links that verifiably exist on the current live site.
 *  Each badge wears the brand's original color with a white glyph;
 *  Lucide stays as the generic fallback. Gmail keeps its multicolor mark. */
export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/budiabdallah20", badgeColor: "#181717", image: "/icons/github.svg", icon: FolderGit, bleachGlyph: true, external: true },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/budi-abdallah-ba61323a7/",
    badgeColor: "#0A66C2",
    image: "/icons/linkedin.svg",
    icon: Briefcase,
    bleachGlyph: true,
    external: true,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/mohamedabdallahh_18/",
    badgeColor: "#E4405F",
    image: "/icons/instagram.svg",
    icon: Camera,
    bleachGlyph: true,
    external: true,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@mohamedabdallah_10",
    badgeColor: "#010101",
    image: "/icons/tiktok.svg",
    icon: Music2,
    bleachGlyph: true,
    external: true,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/mohamed.abdallah.45254",
    badgeColor: "#0866FF",
    image: "/icons/facebook.svg",
    icon: Share2,
    bleachGlyph: true,
    external: true,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@budiabdallah5695",
    badgeColor: "#FF0033",
    image: "/icons/youtube.svg",
    icon: Play,
    bleachGlyph: true,
    external: true,
  },
  { label: "X", href: "https://x.com/BudiAbdall40046", badgeColor: "#000000", image: "/icons/x-twitter.svg", icon: AtSign, bleachGlyph: true, external: true },
  { label: "WhatsApp", href: "https://wa.me/201065228072", badgeColor: "#25D366", image: "/icons/whatsapp.svg", icon: MessageCircle, bleachGlyph: true, external: true },
  { label: "Email", href: "mailto:budiabdallah922@gmail.com", badgeColor: "#ffffff", image: "/icons/gmail.svg", icon: Mail },
];

export const stackChips = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
] as const;

/**
 * Personal facts — ONLY confirmed data lives here.
 * birthdate powers the live age/day/birthday counters; education renders the
 * timeline. Both stay hidden until filled — never faked.
 */
export const personal: PersonalInfo = {
  birthdate: "2006-10-24",
  education: [
    {
      school: { en: "Suez University", fr: "Université de Suez" },
      faculty: { en: "Faculty of Science", fr: "Faculté des Sciences" },
      department: { en: "Mathematics & Computer Science", fr: "Mathématiques & Informatique" },
      period: "2025 — 2029",
    },
  ],
};
