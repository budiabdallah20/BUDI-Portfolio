"use client";

/**
 * Admin store — the single source of truth the dashboard edits.
 * v2 mirrors the live site section by section: services, skills, projects
 * and certificates carry the SAME fields the site renders, so every card in
 * the dashboard is a faithful simulation of its site twin.
 * TODAY: localStorage-backed (zero backend, instant). TOMORROW: swap the
 * load/save internals for API calls and the whole dashboard keeps working.
 */

import { z } from "zod";
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
  visible: boolean;
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
/* Every editor validates through these schemas before touching the DB —
   the dashboard never stores malformed, oversized or hostile input. */

const str = (max: number, label: string): z.ZodString =>
  z
    .string({ error: `Invalid ${label}` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long (max ${max})`);

const strArr = (maxItems: number, maxLen: number, label: string) =>
  z
    .array(z.string().trim().min(1).max(maxLen))
    .max(maxItems, `Too many ${label} (max ${maxItems})`)
    .default([]);

export const serviceSchema = z.object({
  title: str(80, "Title"),
  titleFr: z.string().trim().max(80).default(""),
  desc: str(400, "Description"),
  descFr: z.string().trim().max(400).default(""),
  tags: strArr(12, 30, "tags"),
  points: strArr(10, 160, "deliverables"),
  pointsFr: strArr(10, 160, "deliverables (FR)"),
  category: z.enum(["development", "design", "backend", "growth"]),
  icon: z.string().trim().max(40).default(""),
  iconImage: z.string().trim().max(1500000).default(""),
  bestForEn: str(80, "Best-for (EN)"),
  bestForFr: str(80, "Best-for (FR)"),
  timelineEn: str(80, "Timeline (EN)"),
  timelineFr: str(80, "Timeline (FR)"),
});

export const skillSchema = z.object({
  name: str(40, "Name"),
  cat: z.enum(["frontend", "backend", "tools"]),
  level: z.coerce.number().int().min(10).max(100),
  proof: z.enum(["daily", "portfolio", "client", "learning"]),
  logo: z.string().trim().max(160).default(""),
  icon: z.string().trim().max(40).default(""),
  detailEn: z.string().trim().max(220).default(""),
  detailFr: z.string().trim().max(220).default(""),
});

export const projectSchema = z.object({
  title: str(80, "Title"),
  titleFr: z.string().trim().max(80).default(""),
  desc: str(400, "Description"),
  descFr: z.string().trim().max(400).default(""),
  tech: strArr(14, 30, "tech"),
  status: z.enum(["completed", "in-progress"]),
  category: z.string().trim().max(40).default(""),
  github: z.string().trim().max(200).default(""),
  period: z.string().trim().max(40).default(""),
  year: z.string().trim().max(9).default(""),
  demo: z.string().trim().max(200).default(""),
  image: z.string().trim().max(1500000).default(""),
  roleEn: z.string().trim().max(120).default(""),
  roleFr: z.string().trim().max(120).default(""),
  timelineEn: z.string().trim().max(80).default(""),
  timelineFr: z.string().trim().max(80).default(""),
  briefEn: strArr(8, 220, "brief points"),
  briefFr: strArr(8, 220, "brief points"),
});

export const certSchema = z.object({
  titleEn: str(90, "Title (EN)"),
  titleFr: str(90, "Title (FR)"),
  issuerEn: str(60, "Issuer (EN)"),
  issuerFr: str(60, "Issuer (FR)"),
  year: z.string().trim().max(9).default(""),
  months: z.coerce.number().int().min(1).max(60),
  code: z.string().trim().max(40).default(""),
  skills: strArr(10, 30, "skills"),
  image: z.string().trim().max(1500000).default(""),
  verify: z.string().trim().max(200).default(""),
});

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true };
  const errors = res.error.issues.map((i) => {
    const path = i.path.join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
  return { ok: false, errors: errors.slice(0, 5) };
}

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
    visible: true,
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
    },
    visitsBase: 0,
    visitsBump: 0,
  };
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
            visible: typeof c.visible === "boolean" ? c.visible : true,
          };
        })
      : fresh.certs;
    const settings = normalizeSettings(raw.settings);
    return {
      version: 3,
      skills,
      services,
      projects,
      certs,
      settings,
      visitsBase: typeof raw.visitsBase === "number" ? raw.visitsBase : fresh.visitsBase,
      visitsBump: typeof raw.visitsBump === "number" ? raw.visitsBump : 0,
    };
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
  }
  for (const s of db.skills) {
    if (typeof s.icon !== "string") s.icon = "";
  }
  for (const p of db.projects) {
    if (typeof p.image !== "string") p.image = "";
    if (typeof (p as { sponsored?: unknown }).sponsored !== "boolean")
      (p as { sponsored: boolean }).sponsored = false;
  }
  if (db.settings) {
    const st = db.settings as unknown as Record<string, unknown>;
    if (typeof st.siteVerified !== "boolean") st.siteVerified = true;
    if (!Array.isArray(st.verificationBadges)) st.verificationBadges = [];
  }
}

export function loadDB(): AdminDB {
  const key = scopedKey(STORE_KEY);
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
  const fresh = seed();
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
  const fresh = seed();
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
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
