import { SKILLS } from "@/components/sections/Skills";
import type { Lang } from "@/i18n/dictionaries";
import type { RemoteContent } from "@/lib/content";
import { museumSkillAllowed } from "@/lib/museum-content";
import { canonicalTechnology } from "@/lib/skill-usage";

export const editorialSkillAnchor = (id: string) => "work-skill-" + encodeURIComponent(id).replaceAll("%", "_");

const additions = [
  {
    name: "Supabase", technology: "supabase", cat: "backend", logo: "/icons/tech/supabase.svg",
    detail: { en: "PostgreSQL data modeling, authentication and access policies.", fr: "Modélisation PostgreSQL, authentification et règles d’accès." },
  },
  {
    name: "Vercel", technology: "vercel", cat: "tools", logo: "/icons/tech/vercel.svg",
    detail: { en: "Deploying Next.js applications and reviewing previews, builds and runtime logs.", fr: "Déploiement Next.js et lecture des aperçus, des builds et des journaux." },
  },
  {
    name: "Figma", technology: "figma", cat: "tools", logo: "/icons/tech/figma.svg",
    detail: { en: "Interface prototypes, reusable components and design-to-code handoff.", fr: "Prototypes, composants réutilisables et passage de la maquette au code." },
  },
  {
    name: "Canva", technology: "canva", cat: "tools", logo: "/icons/tech/canva.png",
    detail: { en: "Visual compositions, presentations and export-ready graphics.", fr: "Compositions visuelles, présentations et préparation des exports." },
  },
] as const;

export function editorialSkills(content: RemoteContent | null, locale: Lang) {
  const source = content?.skills ?? SKILLS;
  const configured = new Set(source.map(skill => canonicalTechnology(skill.name)));
  const entries = source.filter(skill => (!("visible" in skill) || skill.visible !== false) && museumSkillAllowed(skill)).map(skill => {
    const technology = canonicalTechnology(skill.name);
    const addition = additions.find(item => item.technology === technology);
    const id = "id" in skill ? skill.id : technology;
    const detail = "detailEn" in skill
      ? locale === "fr" ? skill.detailFr || skill.detailEn : skill.detailEn
      : skill.detail[locale];

    return {
      name: skill.name,
      logo: addition?.logo || skill.logo,
      technology,
      cat: skill.cat,
      anchor: editorialSkillAnchor(id),
      detail: detail || addition?.detail[locale] || "",
      level: Number.isFinite(skill.level) ? Math.max(0, Math.min(100, skill.level)) : undefined,
      years: "years" in skill && typeof skill.years === "number" && skill.years > 0 ? skill.years : undefined,
    };
  });
  return [...entries, ...additions.filter(skill => !configured.has(skill.technology)).map(skill => ({
    ...skill, anchor: editorialSkillAnchor(skill.technology), detail: skill.detail[locale], level: undefined, years: undefined,
  }))];
}
