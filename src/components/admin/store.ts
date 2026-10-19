"use client";

/**
 * Admin store — the single source of truth the dashboard edits.
 * v2 mirrors the live site section by section: services, skills, projects
 * and certificates carry the SAME fields the site renders, so every card in
 * the dashboard is a faithful simulation of its site twin.
 * TODAY: localStorage-backed (zero backend, instant). TOMORROW: swap the
 * load/save internals for API calls and the whole dashboard keeps working.
 */

import { dictionaries } from "@/i18n/dictionaries";
import { SKILLS as SITE_SKILLS } from "@/components/sections/Skills";

export interface AdminSkill {
  id: string;
  name: string;
  cat: "frontend" | "backend" | "tools";
  level: number;
  proof: "daily" | "portfolio" | "client" | "learning";
  logo: string;
  /** Library icon key (see lib/brandIcons) — wins over logo when set. */
  icon: string;
  detailEn: string;
  detailFr: string;
  visible: boolean;
  /** Years of hands-on experience with this skill. */
  years: number;
  /** "Currently leveling up" flag — drives the learning spotlight. */
  learningNow: boolean;
  /** Linked certificate id that proves this skill (optional). */
  certId: string;
  /** Featured flag — featured skills pin to the top-3 headline. */
  featured: boolean;
  /** Manual display order (lower first). 0 = auto (by level). */
  order: number;
}

export type ServiceCategory = "development" | "design" | "backend" | "growth";

export interface AdminService {
  id: string;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  tags: string[];
  points: string[];
  pointsFr: string[];
  category: ServiceCategory;
  /** Library icon key (see lib/brandIcons) — wins over iconImage when set. */
  icon: string;
  /** Custom icon image (path or https URL) — used when icon is empty. */
  iconImage: string;
  bestForEn: string;
  bestForFr: string;
  timelineEn: string;
  timelineFr: string;
  visible: boolean;
  /** Starting price label shown on the card (e.g. "Starting at $500"). */
  startingPrice: string;
  /** Currency code for the price (e.g. "USD", "IQD"). */
  currency: string;
  /** Call-to-action link (contact/whatsapp/calendly). */
  ctaLink: string;
  ctaLabelEn: string;
  ctaLabelFr: string;
  /** FAQ entries shown on the service card/modal. */
  faq: { qEn: string; aEn: string; qFr: string; aFr: string }[];
  /** "Most requested" badge. */
  popular: boolean;
  /** Typical delivery in days. */
  deliveryDays: number;
  /** Revision rounds included. */
  revisions: number;
  /** Testimonial snippet shown on the card. */
  testimonialQuote: string;
  testimonialAuthor: string;
  /** Optional add-on packages. */
  addons: string[];
  /** Override category color (hex). Empty = category default. */
  iconColor: string;
}

export interface AdminProject {
  id: string;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  tech: string[];
  status: "completed" | "in-progress";
  opensource: boolean;
  category: string;
  github: string;
  period: string;
  year: string;
  demo: string;
  /** Cover image — upload (data URL) or path/URL. Empty = default cover art. */
  image: string;
  roleEn: string;
  roleFr: string;
  timelineEn: string;
  timelineFr: string;
  briefEn: string[];
  briefFr: string[];
  /** "Sponsored by BUDI" proof badge with our logo on the project card. */
  sponsored: boolean;
  visible: boolean;
  /** Extra screenshots (paths/URLs/data URLs). */
  gallery: string[];
  /** Embedded demo URL (YouTube/Vimeo/iframe). */
  demoEmbed: string;
  /** Short impact statement shown on the card. */
  impactEn: string;
  impactFr: string;
  /** Client name (B2B proof). */
  clientName: string;
  /** Client logo image. */
  clientLogo: string;
  /** Team size (1 = solo). */
  teamSize: number;
  /** Free-form tags beyond tech stack. */
  tags: string[];
  /** Featured flag — featured projects pin first. */
  featured: boolean;
  /** Progress 0-100 for in-progress projects. */
  progress: number;
  /** Release version label (e.g. "v2.1"). */
  version: string;
  /** Changelog entries (one per line). */
  changelog: string[];
  /** SEO slug for the case-study page. */
  seoSlug: string;
  /** SEO meta description. */
  seoDesc: string;
}

/** Mirrors the live Certificates section shape — no placeholders, no fakes. */
export interface AdminCert {
  id: string;
  titleEn: string;
  titleFr: string;
  issuerEn: string;
  issuerFr: string;
  year: string;
  months: number;
  code: string;
  skills: string[];
  image: string;
  verify: string;
  /** Verified-issuer logo shown beside the verify link (upload or URL). */
  verifyLogo: string;
  visible: boolean;
  /** Expiry date (ISO YYYY-MM-DD). Empty = no expiry. */
  expiry: string;
  /** Difficulty level. */
  level: "beginner" | "intermediate" | "advanced" | "expert";
  /** Study hours. */
  hours: number;
  /** Credential type. */
  type: "certificate" | "badge" | "award" | "course";
  /** Featured flag. */
  featured: boolean;
  /** Uploaded credential file (PDF/image data URL or path). */
  pdf: string;
  /** Precise issue date (ISO YYYY-MM-DD). */
  issueDate: string;
  /** Skills this credential proves (names). */
  linkedSkills: string[];
}

/** Master work-availability switch — ONE button in the dashboard drives every
 *  availability badge on the site (navbar, utility bar, footer, about orbit,
 *  contact) plus the dashboard's own pill. */
export type WorkStatus = "available" | "unavailable";

/** Payment rail state — active (live card) · soon (yellow teaser + optional
 *  date) · off (locked maintenance card — NEVER hidden from the site). */
export type RailState = "active" | "soon" | "off";

const RAIL_STATES: readonly string[] = ["active", "soon", "off"];

/** Dashboard-owned verification seal — multiple badges allowed. */
export interface VerificationBadgeItem {
  id: string;
  labelEn: string;
  labelFr: string;
  /** Logo image (path / URL / data URL). Empty = BadgeCheck icon. */
  logo: string;
}

export interface AdminSettings {
  siteName: string;
  tagline: string;
  maintenance: boolean;
  showLoader: boolean;
  likesEnabled: boolean;
  contactEmail: string;
  /** Master switch: "available" = open for work everywhere. */
  workStatus: WorkStatus;
  /** Shown instead of the default label while unavailable ("Sleeping"…). */
  workNote: string;
  workNoteFr: string;
  /** ISO date (YYYY-MM-DD) — "back on" deadline shown beside the note. */
  workUntil: string;
  /** Payment rails — state gates the site card, account + date are editable.
   *  Each rail is FULLY independent from workStatus and from other rails. */
  vodafoneState: RailState;
  vodafoneNumber: string;
  vodafoneAt: string;
  taptapState: RailState;
  taptapAt: string;
  instapayState: RailState;
  instapayHandle: string;
  instapayAt: string;
  /** Fixed site seal — the BUDI logo verification badge on contact/footer. */
  siteVerified: boolean;
  /** Extra trust seals — zero or more, all dashboard-owned, all read-only on site. */
  verificationBadges: VerificationBadgeItem[];
  /** Site imagery — dashboard-owned hero + about photos (upload or URL). */
  heroImage: string;
  aboutImage: string;
  /** Console display renames for categories — `"<section>:<value>" → label`
   *  (section = service | skill). The site enums never change; only the
   *  console inventory, pickers and badges show the custom label. */
  catLabels: Record<string, string>;
  /** SEO — site-wide meta. */
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  ogImage: string;
  twitterHandle: string;
  canonicalBase: string;
  robotsIndex: boolean;
}

/** Console display label for a category value — per-account rename or fallback. */
export function catDisplayLabel(
  labels: Record<string, string> | undefined,
  section: "service" | "skill",
  value: string,
  fallback: string,
): string {
  const hit = labels?.[`${section}:${value}`];
  return hit && hit.trim() !== "" ? hit : fallback;
}

/**
 * Normalize any settings-shaped object into a clean AdminSettings — fills
 * new fields from seed defaults, coerces garbage to safe values, and DROPS
 * legacy keys (v2 booleans) so cloud upserts never hit missing columns.
 * Every load/import path funnels through here.
 */
export function normalizeSettings(raw: unknown): AdminSettings {
  const fresh = seed().settings;
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, fb: string): string => (typeof v === "string" ? v : fb);
  const bool = (v: unknown, fb: boolean): boolean => (typeof v === "boolean" ? v : fb);
  const rail = (v: unknown, fb: RailState): RailState =>
    typeof v === "string" && (RAIL_STATES as readonly string[]).includes(v)
      ? (v as RailState)
      : fb;
  const catLabels = (v: unknown): Record<string, string> => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val !== "string" || k.length > 80) continue;
      out[k.slice(0, 80)] = val.slice(0, 60);
      if (Object.keys(out).length >= 60) break;
    }
    return out;
  };
  const badges = (v: unknown): VerificationBadgeItem[] => {
    if (!Array.isArray(v)) return [...fresh.verificationBadges];
    return v
      .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
      .slice(0, 12)
      .map((b, i) => ({
        id: typeof b.id === "string" && b.id ? b.id.slice(0, 60) : `badge-${i}`,
        labelEn: typeof b.labelEn === "string" ? b.labelEn.slice(0, 60) : "",
        labelFr: typeof b.labelFr === "string" ? b.labelFr.slice(0, 60) : "",
        logo: typeof b.logo === "string" ? b.logo.slice(0, 1500000) : "",
      }))
      .filter((b) => b.labelEn !== "" || b.labelFr !== "");
  };
  return {
    siteName: str(r.siteName, fresh.siteName),
    tagline: str(r.tagline, fresh.tagline),
    maintenance: bool(r.maintenance, fresh.maintenance),
    showLoader: bool(r.showLoader, fresh.showLoader),
    likesEnabled: bool(r.likesEnabled, fresh.likesEnabled),
    contactEmail: str(r.contactEmail, fresh.contactEmail),
    workStatus: r.workStatus === "unavailable" ? "unavailable" : "available",
    workNote: str(r.workNote, fresh.workNote),
    workNoteFr: str(r.workNoteFr, fresh.workNoteFr),
    workUntil: str(r.workUntil, fresh.workUntil),
    vodafoneState: rail(r.vodafoneState, r.vodafoneOn === false ? "off" : "active"),
    vodafoneNumber: str(r.vodafoneNumber, fresh.vodafoneNumber),
    vodafoneAt: str(r.vodafoneAt, fresh.vodafoneAt),
    taptapState: rail(r.taptapState, r.taptapOn === false ? "off" : "active"),
    taptapAt: str(r.taptapAt, fresh.taptapAt),
    instapayState: rail(r.instapayState, r.instapayOn === true ? "active" : "soon"),
    instapayHandle: str(r.instapayHandle, fresh.instapayHandle),
    instapayAt: str(r.instapayAt, fresh.instapayAt),
    siteVerified: bool(r.siteVerified, fresh.siteVerified),
    verificationBadges: badges(r.verificationBadges),
    heroImage: str(r.heroImage, fresh.heroImage).slice(0, 1500000),
    aboutImage: str(r.aboutImage, fresh.aboutImage).slice(0, 1500000),
    catLabels: catLabels(r.catLabels),
    seoTitle: str(r.seoTitle, fresh.seoTitle).slice(0, 120),
    seoDesc: str(r.seoDesc, fresh.seoDesc).slice(0, 320),
    seoKeywords: str(r.seoKeywords, fresh.seoKeywords).slice(0, 500),
    ogImage: str(r.ogImage, fresh.ogImage).slice(0, 1500000),
    twitterHandle: str(r.twitterHandle, fresh.twitterHandle).slice(0, 40),
    canonicalBase: str(r.canonicalBase, fresh.canonicalBase).slice(0, 200),
    robotsIndex: bool(r.robotsIndex, fresh.robotsIndex),
  };
}

export interface AdminDB {
  version: 3;
  skills: AdminSkill[];
  services: AdminService[];
  projects: AdminProject[];
  certs: AdminCert[];
  settings: AdminSettings;
  visitsBase: number;
  visitsBump: number;
}

const LEGACY_STORE_KEY = "budi-admin-db";
const LEGACY_VISITS_KEY = "budi-visits";
export const SKILL_LIKES_BASE_KEY = "budi-skill-likes";
export const SITE_LIKES_BASE_KEY = "budi-likes";

/**
 * BUDI OS workspace namespace — set once by AdminApp when a workspace
 * opens. "" = legacy single-dashboard mode (old keys untouched).
 * Every dashboard gets fully isolated storage: DB, visits, likes.
 */
let storeNamespace = "";

export function setStoreNamespace(id: string): void {
  storeNamespace = (id || "").trim().slice(0, 60);
}

export function getStoreNamespace(): string {
  return storeNamespace;
}

/** Namespaced browser key — `budi-admin-db` → `budi-admin-db__<ws>`. */
export function scopedKey(base: string): string {
  return storeNamespace === "" ? base : `${base}__${storeNamespace}`;
}

const STORE_KEY = LEGACY_STORE_KEY;
const VISITS_KEY = LEGACY_VISITS_KEY;

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";

/** HR engagement defaults per craft — identical wording to the live section. */
export const CATEGORY_DEFAULTS: Record<
  ServiceCategory,
  { bestForEn: string; bestForFr: string; timelineEn: string; timelineFr: string }
> = {
  development: {
    bestForEn: "Startups & SaaS founders",
    bestForFr: "Startups & fondateurs SaaS",
    timelineEn: "1–4 weeks · weekly demos",
    timelineFr: "1–4 semaines · démos hebdo",
  },
  design: {
    bestForEn: "Brands & landing pages",
    bestForFr: "Marques & landing pages",
    timelineEn: "3–10 days · 2 revision rounds",
    timelineFr: "3–10 jours · 2 allers-retours",
  },
  backend: {
    bestForEn: "Dashboards & platforms",
    bestForFr: "Dashboards & plateformes",
    timelineEn: "1–3 weeks · API docs included",
    timelineFr: "1–3 semaines · docs API incluses",
  },
  growth: {
    bestForEn: "Launches & SEO pushes",
    bestForFr: "Lancements & SEO",
    timelineEn: "1–2 weeks · measurable wins",
    timelineFr: "1–2 semaines · gains mesurables",
  },
};

/* ------------------------- zod protection layer ------------------------ */
/* Schemas live in @/lib/validation (server-safe) so /api/admin/* writes
   re-validate with the SAME rules — re-exported here so every dashboard
   editor keeps importing from the store untouched. */
export {
  certSchema,
  isTableName,
  projectSchema,
  serviceSchema,
  skillSchema,
  tableSchemas,
  validate,
  type TableName as ValidatedTableName,
  type ValidationResult,
} from "@/lib/validation";

/* --------------------------------- seed --------------------------------- */

function seedServices(): AdminService[] {
  const enItems = dictionaries.en.services.items;
  const frItems = dictionaries.fr.services.items;
  return enItems.map((s, i) => {
    const cat = s.category as ServiceCategory;
    const defaults = CATEGORY_DEFAULTS[cat] ?? CATEGORY_DEFAULTS.development;
    const fr = frItems[i];
    return {
      id: `srv-${slug(s.title)}`,
      title: s.title,
      titleFr: fr?.title ?? s.title,
      desc: s.desc,
      descFr: fr?.desc ?? s.desc,
      tags: [...s.tags],
      points: [...s.points],
      pointsFr: fr ? [...fr.points] : [...s.points],
      category: cat,
       icon: "",
       iconImage: "",
       bestForEn: defaults.bestForEn,
       bestForFr: defaults.bestForFr,
       timelineEn: defaults.timelineEn,
       timelineFr: defaults.timelineFr,
       visible: true,
       startingPrice: "",
       currency: "USD",
       ctaLink: "",
       ctaLabelEn: "Get a quote",
       ctaLabelFr: "Demander un devis",
       faq: [],
       popular: false,
       deliveryDays: 0,
       revisions: 2,
       testimonialQuote: "",
       testimonialAuthor: "",
       addons: [],
       iconColor: "",
     };
  });
}

/** Real credentials — the exact six the Certificates section renders. */
function seedCerts(): AdminCert[] {
  const rows: Array<[string, string, string, string, string, number, string, string[]]> = [
    ["AWS Solutions Architect", "AWS Solutions Architect", "Amazon Web Services", "Amazon Web Services", "2024", 6, "CERT-AWS-24", ["AWS", "EC2", "S3"]],
    ["Meta Frontend Developer", "Meta Frontend Developer", "Meta", "Meta", "2023", 8, "CERT-META-23", ["React", "JavaScript"]],
    ["Google UX Design", "Google UX Design", "Google", "Google", "2023", 6, "CERT-GOOGLE-23", ["Figma", "UX"]],
    ["Full Stack Web Development", "Développement Web Full-Stack", "Coursera", "Coursera", "2023", 12, "CERT-COURSERA-23", ["MongoDB", "Express", "React", "Node.js"]],
    ["Cybersecurity Fundamentals", "Fondamentaux Cybersécurité", "IBM", "IBM", "2024", 4, "CERT-IBM-24", ["Security", "Network"]],
    ["DevOps Engineering", "Ingénierie DevOps", "Microsoft", "Microsoft", "2024", 5, "CERT-MS-24", ["Azure", "Docker"]],
  ];
  const images: Record<string, string> = {
    "CERT-AWS-24": "/images/certificates/aws.svg",
    "CERT-META-23": "/images/certificates/meta.svg",
    "CERT-GOOGLE-23": "/images/certificates/google.svg",
    "CERT-COURSERA-23": "/images/certificates/coursera.svg",
    "CERT-IBM-24": "/images/certificates/ibm.svg",
    "CERT-MS-24": "/images/certificates/ms.svg",
  };
  return rows.map(([titleEn, titleFr, issuerEn, issuerFr, year, months, code, skills]) => ({
    id: `cert-${slug(code)}`,
    titleEn,
    titleFr,
    issuerEn,
    issuerFr,
    year,
    months,
    code,
    skills: [...skills],
     image: images[code] ?? "",
     verify: "",
     verifyLogo: "",
     visible: true,
     expiry: "",
     level: "intermediate",
     hours: 0,
     type: "certificate",
     featured: false,
     pdf: "",
     issueDate: "",
     linkedSkills: [...skills],
   }));
}

function seed(): AdminDB {
  return {
    version: 3,
     skills: SITE_SKILLS.map((s) => ({
       id: `skill-${slug(s.name)}`,
       name: s.name,
       cat: s.cat,
       level: s.level,
       proof: s.proof,
       logo: s.logo,
       icon: "",
       detailEn: s.detail.en,
       detailFr: s.detail.fr,
       visible: true,
       years: 0,
       learningNow: s.proof === "learning",
       certId: "",
       featured: s.level >= 85,
       order: 0,
     })),
    services: seedServices(),
    projects: dictionaries.en.projects.items.map((p, i) => ({
      id: `proj-${slug(p.github.split("/").pop() || p.title)}`,
      title: p.title,
      titleFr: dictionaries.fr.projects.items[i]?.title ?? p.title,
      desc: p.desc,
      descFr: dictionaries.fr.projects.items[i]?.desc ?? p.desc,
      tech: [...p.tech],
      status: p.status,
      opensource: p.opensource,
      category: p.category,
      github: p.github,
      period: p.period,
      year: p.year,
      demo: "",
      image: "",
      roleEn: "",
      roleFr: "",
      timelineEn: "",
      timelineFr: "",
      briefEn: [],
      briefFr: [],
       sponsored: false,
       visible: true,
       gallery: [],
       demoEmbed: "",
       impactEn: "",
       impactFr: "",
       clientName: "",
       clientLogo: "",
       teamSize: 1,
       tags: [],
       featured: false,
       progress: 0,
       version: "",
       changelog: [],
       seoSlug: "",
       seoDesc: "",
     })),
    certs: seedCerts(),
    settings: {
      siteName: "BUDI",
      tagline: "I don't just build — I engineer systems.",
      maintenance: false,
      showLoader: true,
      likesEnabled: true,
      contactEmail: "budiabdallah922@gmail.com",
      workStatus: "available",
      workNote: "",
      workNoteFr: "",
      workUntil: "",
      vodafoneState: "active",
      vodafoneNumber: "01065228072",
      vodafoneAt: "",
      taptapState: "active",
      taptapAt: "",
      instapayState: "soon",
      instapayHandle: "",
      instapayAt: "",
      siteVerified: true,
      verificationBadges: [],
       heroImage: "/images/general/hero.jpg",
       aboutImage: "/images/general/about2.jpg",
       catLabels: {},
       seoTitle: "BUDI — I don't just build, I engineer systems.",
       seoDesc: "Portfolio of BUDI — full-stack developer & designer. Projects, skills, services and certificates.",
       seoKeywords: "BUDI, portfolio, full-stack developer, Next.js, React, TypeScript, web design, services",
       ogImage: "/images/general/hero.jpg",
       twitterHandle: "@budi",
       canonicalBase: "",
       robotsIndex: true,
     },
    visitsBase: 0,
    visitsBump: 0,
  };
}

/**
 * Empty console for a brand-new BUDI OS account — zero services, skills,
 * projects and certificates, so opening e.g. Kayan never shows another
 * dashboard's content. Only the main BUDI Portfolio workspace inherits the
 * full seed; every other account starts blank with its own welcome.
 */
function emptyDb(): AdminDB {
  const base = seed();
  base.skills = [];
  base.services = [];
  base.projects = [];
  base.certs = [];
  base.visitsBase = 0;
  base.visitsBump = 0;
  // Blank BUDI-specific identity — a new account must never wake up
  // wearing another dashboard's name, email, payment rails or photos.
  base.settings = {
    ...base.settings,
    siteName: "",
    tagline: "",
    contactEmail: "",
    workNote: "",
    workNoteFr: "",
    workUntil: "",
    vodafoneNumber: "",
    vodafoneAt: "",
    taptapAt: "",
    instapayHandle: "",
    instapayAt: "",
     heroImage: "",
     aboutImage: "",
     catLabels: {},
     seoTitle: "",
     seoDesc: "",
     seoKeywords: "",
     ogImage: "",
     twitterHandle: "",
     canonicalBase: "",
     robotsIndex: true,
   };
  return base;
}

/**
 * True only for the main console — every other namespace starts empty.
 * FAIL-CLOSED: an unset ("") namespace is NEVER treated as main. The old
 * behavior ("" → main seed + legacy key) meant any code path that read the
 * DB before the namespace was set would wake up wearing BUDI's identity —
 * exactly the "Kayan opens BUDI's dashboard" leak. Now that path yields an
 * empty console instead of someone else's data.
 */
function isMainNamespace(): boolean {
  return storeNamespace === "budi-portfolio";
}

/** v1/v2 → v3 migration — keeps every edit, fills new bilingual fields. */
function migrateToV3(raw: Record<string, unknown>): AdminDB {
  const fresh = seed();
  try {
    const normService = (s: Record<string, unknown>, i: number): AdminService => {
      const fallback = fresh.services[i % fresh.services.length]!;
      const strOf = (v: unknown, fb: string): string => (typeof v === "string" ? v : fb);
      const arrOf = (v: unknown, fb: string[]): string[] =>
        Array.isArray(v) ? (v as string[]).filter((x) => typeof x === "string") : [...fb];
      return {
        id: strOf(s.id, fallback.id),
        title: strOf(s.title, fallback.title),
        titleFr: strOf(s.titleFr, strOf(s.title, fallback.titleFr)),
        desc: strOf(s.desc, fallback.desc),
        descFr: strOf(s.descFr, strOf(s.desc, fallback.descFr)),
        tags: arrOf(s.tags, fallback.tags),
        points: arrOf(s.points, fallback.points),
        pointsFr: arrOf(s.pointsFr, arrOf(s.points, fallback.pointsFr)),
        category:
          s.category === "development" ||
          s.category === "design" ||
          s.category === "backend" ||
          s.category === "growth"
            ? s.category
            : fallback.category,
        bestForEn: strOf(s.bestForEn, fallback.bestForEn),
        bestForFr: strOf(s.bestForFr, fallback.bestForFr),
        timelineEn: strOf(s.timelineEn, fallback.timelineEn),
        timelineFr: strOf(s.timelineFr, fallback.timelineFr),
        icon: strOf(s.icon, ""),
        iconImage: strOf(s.iconImage, ""),
        visible: typeof s.visible === "boolean" ? s.visible : true,
        startingPrice: strOf(s.startingPrice, fallback.startingPrice),
        currency: strOf(s.currency, fallback.currency),
        ctaLink: strOf(s.ctaLink, fallback.ctaLink),
        ctaLabelEn: strOf(s.ctaLabelEn, fallback.ctaLabelEn),
        ctaLabelFr: strOf(s.ctaLabelFr, fallback.ctaLabelFr),
        faq: Array.isArray(s.faq) ? (s.faq as AdminService["faq"]) : [...fallback.faq],
        popular: typeof s.popular === "boolean" ? s.popular : fallback.popular,
        deliveryDays: typeof s.deliveryDays === "number" ? s.deliveryDays : fallback.deliveryDays,
        revisions: typeof s.revisions === "number" ? s.revisions : fallback.revisions,
        testimonialQuote: strOf(s.testimonialQuote, fallback.testimonialQuote),
        testimonialAuthor: strOf(s.testimonialAuthor, fallback.testimonialAuthor),
        addons: arrOf(s.addons, fallback.addons),
        iconColor: strOf(s.iconColor, fallback.iconColor),
      };
    };
    const normProject = (p: Record<string, unknown>, i: number): AdminProject => {
      const fallback = fresh.projects[i % fresh.projects.length]!;
      const strOf = (v: unknown, fb: string): string => (typeof v === "string" ? v : fb);
      const arrOf = (v: unknown, fb: string[]): string[] =>
        Array.isArray(v) ? (v as string[]).filter((x) => typeof x === "string") : [...fb];
      return {
        ...(fallback as AdminProject),
        ...(p as Partial<AdminProject>),
        id: strOf(p.id, fallback.id),
        title: strOf(p.title, fallback.title),
        titleFr: strOf(p.titleFr, strOf(p.title, fallback.titleFr)),
        desc: strOf(p.desc, fallback.desc),
        descFr: strOf(p.descFr, strOf(p.desc, fallback.descFr)),
        tech: arrOf(p.tech, fallback.tech),
        period: strOf(p.period, fallback.period),
        briefEn: arrOf(p.briefEn, fallback.briefEn),
        briefFr: arrOf(p.briefFr, fallback.briefFr),
        visible: typeof p.visible === "boolean" ? (p.visible as boolean) : true,
      };
    };
    const skills = Array.isArray(raw.skills) ? (raw.skills as AdminDB["skills"]) : fresh.skills;
    const rawServices = Array.isArray(raw.services) ? raw.services : [];
    const services: AdminService[] =
      rawServices.length > 0
        ? (rawServices as Record<string, unknown>[]).map(normService)
        : fresh.services;
    const rawProjects = Array.isArray(raw.projects) ? raw.projects : [];
    const projects: AdminProject[] =
      rawProjects.length > 0
        ? (rawProjects as Record<string, unknown>[]).map(normProject)
        : fresh.projects;
    const oldCerts = Array.isArray(raw.certs) ? (raw.certs as Array<Record<string, unknown>>) : [];
    const certs: AdminCert[] = oldCerts.length
      ? oldCerts.map((c, i) => {
          const fallback = fresh.certs[i % fresh.certs.length]!;
          return {
            id: typeof c.id === "string" ? c.id : fallback.id,
            titleEn: typeof c.titleEn === "string" ? c.titleEn : fallback.titleEn,
            titleFr: typeof c.titleFr === "string" ? c.titleFr : fallback.titleFr,
            issuerEn: typeof c.issuerEn === "string" ? c.issuerEn : fallback.issuerEn,
            issuerFr: typeof c.issuerFr === "string" ? c.issuerFr : fallback.issuerFr,
            year: typeof c.year === "string" ? c.year : fallback.year,
            months: typeof c.months === "number" ? c.months : fallback.months,
            code: typeof c.code === "string" ? c.code : fallback.code,
            skills: Array.isArray(c.skills) ? (c.skills as string[]) : [...fallback.skills],
            image: typeof c.image === "string" ? c.image : fallback.image,
            verify: typeof c.verify === "string" ? c.verify : fallback.verify,
            verifyLogo: typeof c.verifyLogo === "string" ? c.verifyLogo.slice(0, 1500000) : "",
            visible: typeof c.visible === "boolean" ? c.visible : true,
            expiry: typeof c.expiry === "string" ? c.expiry : fallback.expiry,
            level:
              c.level === "beginner" || c.level === "intermediate" || c.level === "advanced" || c.level === "expert"
                ? c.level
                : fallback.level,
            hours: typeof c.hours === "number" ? c.hours : fallback.hours,
            type:
              c.type === "certificate" || c.type === "badge" || c.type === "award" || c.type === "course"
                ? c.type
                : fallback.type,
            featured: typeof c.featured === "boolean" ? c.featured : fallback.featured,
            pdf: typeof c.pdf === "string" ? c.pdf.slice(0, 1500000) : fallback.pdf,
            issueDate: typeof c.issueDate === "string" ? c.issueDate : fallback.issueDate,
            linkedSkills: Array.isArray(c.linkedSkills)
              ? (c.linkedSkills as string[])
              : [...fallback.linkedSkills],
          };
        })
      : fresh.certs;
    const settings = normalizeSettings(raw.settings);
    const next: AdminDB = {
      version: 3,
      skills,
      services,
      projects,
      certs,
      settings,
      visitsBase: typeof raw.visitsBase === "number" ? raw.visitsBase : fresh.visitsBase,
      visitsBump: typeof raw.visitsBump === "number" ? raw.visitsBump : 0,
    };
    backfillMedia(next);
    return next;
  } catch {
    return fresh;
  }
}

export interface RemoteRows {
  services: unknown[];
  skills: unknown[];
  projects: unknown[];
  certs: unknown[];
  settings: Record<string, unknown> | null;
}

/**
 * Normalize Supabase rows into an AdminDB — fills any missing bilingual
 * field from seed defaults so remote rows always render. Call ONLY when
 * the snapshot actually has rows (empty DB is a real state: needs seeding).
 */
export function fromRemote(rows: RemoteRows): AdminDB {
  const next = migrateToV3({ ...rows, visitsBase: 0, visitsBump: 0 });
  next.visitsBase = 0;
  next.visitsBump = 0;
  return next;
}

/** v3 rows saved before the media fields existed get safe defaults —
 *  old browsers keep working, new features degrade to previous behavior. */
function backfillMedia(db: AdminDB): void {
  for (const s of db.services) {
    if (typeof s.icon !== "string") s.icon = "";
    if (typeof s.iconImage !== "string") s.iconImage = "";
    if (typeof s.startingPrice !== "string") s.startingPrice = "";
    if (typeof s.currency !== "string") s.currency = "USD";
    if (typeof s.ctaLink !== "string") s.ctaLink = "";
    if (typeof s.ctaLabelEn !== "string") s.ctaLabelEn = "Get a quote";
    if (typeof s.ctaLabelFr !== "string") s.ctaLabelFr = "Demander un devis";
    if (!Array.isArray(s.faq)) s.faq = [];
    if (typeof s.popular !== "boolean") s.popular = false;
    if (typeof s.deliveryDays !== "number") s.deliveryDays = 0;
    if (typeof s.revisions !== "number") s.revisions = 2;
    if (typeof s.testimonialQuote !== "string") s.testimonialQuote = "";
    if (typeof s.testimonialAuthor !== "string") s.testimonialAuthor = "";
    if (!Array.isArray(s.addons)) s.addons = [];
    if (typeof s.iconColor !== "string") s.iconColor = "";
  }
  for (const s of db.skills) {
    if (typeof s.icon !== "string") s.icon = "";
    if (typeof s.years !== "number") s.years = 0;
    if (typeof s.learningNow !== "boolean") s.learningNow = s.proof === "learning";
    if (typeof s.certId !== "string") s.certId = "";
    if (typeof s.featured !== "boolean") s.featured = s.level >= 85;
    if (typeof s.order !== "number") s.order = 0;
  }
  for (const p of db.projects) {
    if (typeof p.image !== "string") p.image = "";
    if (typeof (p as { sponsored?: unknown }).sponsored !== "boolean")
      (p as { sponsored: boolean }).sponsored = false;
    if (!Array.isArray(p.gallery)) p.gallery = [];
    if (typeof p.demoEmbed !== "string") p.demoEmbed = "";
    if (typeof p.impactEn !== "string") p.impactEn = "";
    if (typeof p.impactFr !== "string") p.impactFr = "";
    if (typeof p.clientName !== "string") p.clientName = "";
    if (typeof p.clientLogo !== "string") p.clientLogo = "";
    if (typeof p.teamSize !== "number") p.teamSize = 1;
    if (!Array.isArray(p.tags)) p.tags = [];
    if (typeof p.featured !== "boolean") p.featured = false;
    if (typeof p.progress !== "number") p.progress = 0;
    if (typeof p.version !== "string") p.version = "";
    if (!Array.isArray(p.changelog)) p.changelog = [];
    if (typeof p.seoSlug !== "string") p.seoSlug = "";
    if (typeof p.seoDesc !== "string") p.seoDesc = "";
  }
  for (const c of db.certs) {
    if (typeof (c as { verifyLogo?: unknown }).verifyLogo !== "string")
      (c as { verifyLogo: string }).verifyLogo = "";
    if (typeof c.expiry !== "string") c.expiry = "";
    if (c.level !== "beginner" && c.level !== "intermediate" && c.level !== "advanced" && c.level !== "expert")
      c.level = "intermediate";
    if (typeof c.hours !== "number") c.hours = 0;
    if (c.type !== "certificate" && c.type !== "badge" && c.type !== "award" && c.type !== "course")
      c.type = "certificate";
    if (typeof c.featured !== "boolean") c.featured = false;
    if (typeof c.pdf !== "string") c.pdf = "";
    if (typeof c.issueDate !== "string") c.issueDate = "";
    if (!Array.isArray(c.linkedSkills)) c.linkedSkills = [...(c.skills ?? [])];
  }
  if (db.settings) {
    const st = db.settings as unknown as Record<string, unknown>;
    if (typeof st.siteVerified !== "boolean") st.siteVerified = true;
    if (!Array.isArray(st.verificationBadges)) st.verificationBadges = [];
    if (!st.catLabels || typeof st.catLabels !== "object" || Array.isArray(st.catLabels))
      st.catLabels = {};
    if (typeof st.seoTitle !== "string") st.seoTitle = "";
    if (typeof st.seoDesc !== "string") st.seoDesc = "";
    if (typeof st.seoKeywords !== "string") st.seoKeywords = "";
    if (typeof st.ogImage !== "string") st.ogImage = "";
    if (typeof st.twitterHandle !== "string") st.twitterHandle = "";
    if (typeof st.canonicalBase !== "string") st.canonicalBase = "";
    if (typeof st.robotsIndex !== "boolean") st.robotsIndex = true;
  }
}

export function loadDB(): AdminDB {
  const key = scopedKey(STORE_KEY);
  if (storeNamespace === "" && typeof console !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(
      "[admin-store] loadDB with unset namespace — call setStoreNamespace(workspaceId) first. Failing closed to an empty console.",
    );
  }
  try {
    let raw = window.localStorage.getItem(key);
    // Upgrade path: ONLY the main BUDI Portfolio workspace inherits the
    // legacy database once. Brand-new accounts start EMPTY (fresh seed)
    // so every dashboard begins clean with its own welcome.
    if (!raw && storeNamespace === "budi-portfolio") {
      const legacy = window.localStorage.getItem(LEGACY_STORE_KEY);
      if (legacy) {
        try {
          window.localStorage.setItem(key, legacy);
        } catch {
          /* storage blocked — fall through to seed */
        }
        raw = legacy;
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && parsed.version === 3 && Array.isArray(parsed.skills)) {
        const db = parsed as unknown as AdminDB;
        db.settings = normalizeSettings(db.settings);
        backfillMedia(db);
        return db;
      }
      if (parsed && (parsed.version === 1 || parsed.version === 2)) {
        const migrated = migrateToV3(parsed);
        saveDB(migrated);
        return migrated;
      }
    }
  } catch {
    /* corrupted/blocked — reseed */
  }
  // Fresh account with no stored DB: main console gets the full seed,
  // every other workspace gets a blank console + its own welcome.
  const fresh = isMainNamespace() ? seed() : emptyDb();
  saveDB(fresh);
  return fresh;
}

export function saveDB(db: AdminDB): void {
  try {
    window.localStorage.setItem(scopedKey(STORE_KEY), JSON.stringify(db));
  } catch {
    /* storage blocked — dashboard still works in-memory this session */
  }
}

export function resetDB(): AdminDB {
  const fresh = isMainNamespace() ? seed() : emptyDb();
  fresh.visitsBump = 0;
  saveDB(fresh);
  return fresh;
}

/** Serialized backup for export / restore. */
export function exportJSON(db: AdminDB): string {
  return JSON.stringify(db, null, 2);
}

export function importJSON(text: string): AdminDB | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.version === 3 && Array.isArray(parsed.skills)) {
      const db = parsed as unknown as AdminDB;
      db.settings = normalizeSettings(db.settings);
      backfillMedia(db);
      return db;
    }
    if (parsed.version === 1 || parsed.version === 2) return migrateToV3(parsed);
    return null;
  } catch {
    return null;
  }
}

/** Local integrity self-checks — the honesty core of the security monitor. */
export interface IntegrityCheck {
  key: string;
  ok: boolean;
  detail: string;
}

export function checkIntegrity(db: AdminDB | null): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];
  let storageOk = false;
  try {
    window.localStorage.setItem("__t", "1");
    window.localStorage.removeItem("__t");
    storageOk = true;
  } catch {
    storageOk = false;
  }
  checks.push({
    key: "storage",
    ok: storageOk,
    detail: storageOk ? "localStorage read · write OK" : "localStorage blocked — memory only",
  });
  const shapeOk =
    !!db &&
    db.version === 3 &&
    Array.isArray(db.skills) &&
    Array.isArray(db.services) &&
    Array.isArray(db.projects) &&
    Array.isArray(db.certs);
  checks.push({
    key: "database",
    ok: shapeOk,
    detail: shapeOk
      ? `v2 · ${db!.skills.length} skills · ${db!.services.length} services · ${db!.projects.length} projects · ${db!.certs.length} certs`
      : "schema mismatch — reseed advised",
  });
  let authed = false;
  try {
    authed = window.sessionStorage.getItem("budi-admin") === "1";
    if (!authed) {
      // BUDI OS per-workspace tabs (budi-os-auth__<id>).
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith("budi-os-auth__")) {
          authed = true;
          break;
        }
      }
    }
  } catch {
    authed = false;
  }
  checks.push({
    key: "session",
    ok: authed,
    detail: authed ? "admin gate passed this tab" : "no admin session",
  });
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  checks.push({
    key: "network",
    ok: online,
    detail: online ? "browser online" : "browser offline — local mode",
  });
  const secure =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" || window.location.hostname === "localhost");
  checks.push({
    key: "transport",
    ok: secure,
    detail: secure ? "secure context (https/localhost)" : "insecure context — serve over https",
  });
  return checks;
}

/** Visitor counter (local mode — the real tracker plugs in with the backend). */
export function bumpVisit(): number {
  try {
    const n = Number(window.localStorage.getItem(scopedKey(VISITS_KEY)) ?? 0) + 1;
    window.localStorage.setItem(scopedKey(VISITS_KEY), String(n));
    return n;
  } catch {
    return 0;
  }
}

export function readVisits(): number {
  try {
    return Number(window.localStorage.getItem(scopedKey(VISITS_KEY)) ?? 0);
  } catch {
    return 0;
  }
}

/** Namespaced site-likes key (same keys the site writes). */
export function siteLikesKey(): string {
  return scopedKey(SITE_LIKES_BASE_KEY);
}

/** Real per-project likes from this browser (same keys the site writes). */
export function readLiked(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(siteLikesKey());
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") {
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v === true) out[k] = true;
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export const SKILL_LIKES_KEY = "budi-skill-likes";

/** Namespaced skill-likes key (same keys the Skills section writes). */
export function skillLikesKey(): string {
  return scopedKey(SKILL_LIKES_BASE_KEY);
}

/** Real per-skill likes from this browser (same keys the Skills section writes). */
export function readSkillLiked(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(skillLikesKey());
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") {
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v === true) out[k] = true;
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function uid(prefix: string): string {
  // Crypto-random IDs: Math.random is predictable + collision-prone.
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
}
