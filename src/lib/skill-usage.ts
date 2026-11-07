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

const aliases: Record<string, string> = {
 reactjs: "react", nextjs: "next", nodejs: "node", tailwindcss: "tailwind", html5: "html", css3: "css", postgres: "postgresql", framer: "motion", framermotion: "motion", motionreact: "motion", gitgithub: "git-github"
};
export function canonicalTechnology(value: string): string {
 const key = value.toLowerCase().replace(/[^a-z0-9+#]/g, "");
 return aliases[key] ?? key;
}
export function skillMatchesTech(skillName: string, tech: string): boolean {
 const skill = canonicalTechnology(skillName); const target = canonicalTechnology(tech);
 if (!skill || !target) return false;
 if (skill === "git-github") return target === "git" || target === "github" || target === skill;
 return skill === target;
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
