import { z } from "zod";

/**
 * Shared zod protection layer — server-safe (imports ONLY zod).
 * The dashboard validates editors client-side AND every /api/admin/*
 * write re-validates server-side, so malformed, oversized or hostile
 * input can never reach Supabase even with a stolen session.
 */

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
  startingPrice: z.string().trim().max(40).default(""),
  currency: z.string().trim().max(8).default("USD"),
  ctaLink: z.string().trim().max(200).default(""),
  ctaLabelEn: z.string().trim().max(40).default("Get a quote"),
  ctaLabelFr: z.string().trim().max(40).default("Demander un devis"),
  faq: z
    .array(
      z.object({
        qEn: z.string().trim().max(160).default(""),
        aEn: z.string().trim().max(400).default(""),
        qFr: z.string().trim().max(160).default(""),
        aFr: z.string().trim().max(400).default(""),
      }),
    )
    .max(8)
    .default([]),
  popular: z.boolean().default(false),
  deliveryDays: z.coerce.number().int().min(0).max(365).default(0),
  revisions: z.coerce.number().int().min(0).max(20).default(2),
  testimonialQuote: z.string().trim().max(300).default(""),
  testimonialAuthor: z.string().trim().max(80).default(""),
  addons: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
  iconColor: z.string().trim().max(20).default(""),
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
  years: z.coerce.number().int().min(0).max(50).default(0),
  learningNow: z.boolean().default(false),
  certId: z.string().trim().max(60).default(""),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0).max(9999).default(0),
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
  gallery: z.array(z.string().trim().max(1500000)).max(8).default([]),
  demoEmbed: z.string().trim().max(300).default(""),
  impactEn: z.string().trim().max(220).default(""),
  impactFr: z.string().trim().max(220).default(""),
  clientName: z.string().trim().max(80).default(""),
  clientLogo: z.string().trim().max(1500000).default(""),
  teamSize: z.coerce.number().int().min(1).max(50).default(1),
  tags: strArr(12, 30, "tags"),
  featured: z.boolean().default(false),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  version: z.string().trim().max(20).default(""),
  changelog: strArr(12, 220, "changelog entries"),
  seoSlug: z.string().trim().max(80).default(""),
  seoDesc: z.string().trim().max(320).default(""),
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
  verifyLogo: z.string().trim().max(1500000).default(""),
  expiry: z.string().trim().max(20).default(""),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  hours: z.coerce.number().int().min(0).max(10000).default(0),
  type: z.enum(["certificate", "badge", "award", "course"]).default("certificate"),
  featured: z.boolean().default(false),
  pdf: z.string().trim().max(1500000).default(""),
  issueDate: z.string().trim().max(20).default(""),
  linkedSkills: strArr(12, 40, "linked skills"),
});

export const tableSchemas = {
  services: serviceSchema,
  skills: skillSchema,
  projects: projectSchema,
  certs: certSchema,
} as const;

export type TableName = keyof typeof tableSchemas;

export function isTableName(value: unknown): value is TableName {
  return (
    typeof value === "string" &&
    (Object.keys(tableSchemas) as string[]).includes(value)
  );
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validate(schema: z.ZodType<unknown>, data: unknown): ValidationResult {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true };
  const errors = res.error.issues.map((i) => {
    const path = i.path.join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
  return { ok: false, errors: errors.slice(0, 5) };
}

/** Rejects JSON bombs before parsing cost grows — Vercel caps bodies at ~4.5MB. */
export const MAX_ROW_CHARS = 2_100_000;
export const MAX_DB_CHARS = 4_000_000;
