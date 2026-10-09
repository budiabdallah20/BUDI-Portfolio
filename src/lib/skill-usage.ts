/** Shared skill → projects usage. One matcher for the site + the dashboard. */

export interface ProjectTechRef {
  title: string;
  tech: string[];
  visible?: boolean;
}

export interface SkillUsage {
  count: number;
  projects: string[];
  /** 0–100 showcase score: mastery blended with real project proof. */
  score: number;
}

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();

const tokensOf = (s: string): string[] =>
  norm(s)
    .split(" ")
    // 3+ chars: "js" must NOT match ("Next.js" is not "Three.js"),
    // while "git"/"css"/"html" still match their techs.
    .filter((t) => t.length >= 3 && t !== "and");

export function skillMatchesTech(skillName: string, tech: string): boolean {
  const skillN = norm(skillName);
  const techN = norm(tech);
  if (!skillN || !techN) return false;
  if (skillN === techN) return true;
  const skillTokens = tokensOf(skillName);
  const techTokens = new Set(tokensOf(tech));
  const shared = skillTokens.filter((t) => techTokens.has(t));
  // Two shared words = strong evidence ("Framer Motion" vs "Motion Design").
  if (shared.length >= 2) return true;
  // Single-word skills may substring-match ("CSS" vs "CSS3", "React" vs
  // "React Native"). Multi-word skills may NOT claim a lone shared word —
  // otherwise "Tailwind CSS" would take credit for vanilla "CSS" projects.
  if (skillTokens.length <= 1) {
    return techN.includes(skillN) || skillN.includes(techN) || shared.length === 1;
  }
  return false;
}

export function skillProjectUsage(
  skillName: string,
  level: number,
  projects: ProjectTechRef[],
): SkillUsage {
  const live = projects.filter((p) => p.visible !== false);
  const matched = live
    .filter((p) => p.tech.some((t) => skillMatchesTech(skillName, t)))
    .map((p) => p.title);
  const count = matched.length;
  const proofBonus = Math.min(count, 5) * 6;
  const levelPart = Math.round(Math.min(100, Math.max(10, level)) * 0.7);
  const score = Math.min(100, levelPart + proofBonus + (count > 0 ? 4 : 0));
  return { count, projects: matched, score };
}

export function usageOfAll(
  skills: { name: string; level: number }[],
  projects: ProjectTechRef[],
): Record<string, SkillUsage> {
  const out: Record<string, SkillUsage> = {};
  for (const s of skills) out[s.name] = skillProjectUsage(s.name, s.level, projects);
  return out;
}
