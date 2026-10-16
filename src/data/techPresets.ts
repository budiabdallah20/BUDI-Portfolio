/**
 * The 50 most-used languages, frameworks & tools — the shared preset pool
 * for the dashboard pickers (project stacks, service icons, skill logos,
 * certificate skills). `logo` reuses the shipped /icons/tech marks when one
 * exists, otherwise "" (the picker falls back to a letter avatar).
 */

export type TechKind = "language" | "framework" | "tool";

export interface TechPreset {
  name: string;
  logo: string;
  kind: TechKind;
}

export const TECH_PRESETS: TechPreset[] = [
  { name: "JavaScript", logo: "/icons/tech/javascript.svg", kind: "language" },
  { name: "TypeScript", logo: "/icons/tech/typescript.svg", kind: "language" },
  { name: "Python", logo: "", kind: "language" },
  { name: "Java", logo: "", kind: "language" },
  { name: "C", logo: "", kind: "language" },
  { name: "C++", logo: "", kind: "language" },
  { name: "C#", logo: "", kind: "language" },
  { name: "Go", logo: "", kind: "language" },
  { name: "Rust", logo: "", kind: "language" },
  { name: "PHP", logo: "", kind: "language" },
  { name: "Ruby", logo: "", kind: "language" },
  { name: "Swift", logo: "", kind: "language" },
  { name: "Kotlin", logo: "", kind: "language" },
  { name: "Dart", logo: "", kind: "language" },
  { name: "HTML", logo: "/icons/tech/html.svg", kind: "language" },
  { name: "CSS", logo: "/icons/tech/css.svg", kind: "language" },
  { name: "SQL", logo: "", kind: "language" },
  { name: "React", logo: "/icons/tech/react.svg", kind: "framework" },
  { name: "Next.js", logo: "/icons/tech/nextjs.svg", kind: "framework" },
  { name: "Vue", logo: "", kind: "framework" },
  { name: "Angular", logo: "", kind: "framework" },
  { name: "Svelte", logo: "", kind: "framework" },
  { name: "Node.js", logo: "/icons/tech/nodejs.svg", kind: "framework" },
  { name: "Express", logo: "", kind: "framework" },
  { name: "NestJS", logo: "", kind: "framework" },
  { name: "Django", logo: "", kind: "framework" },
  { name: "Flask", logo: "", kind: "framework" },
  { name: "Laravel", logo: "", kind: "framework" },
  { name: "Spring Boot", logo: "", kind: "framework" },
  { name: "Tailwind CSS", logo: "/icons/tech/tailwind.svg", kind: "framework" },
  { name: "Bootstrap", logo: "", kind: "framework" },
  { name: "Sass", logo: "", kind: "framework" },
  { name: "GSAP", logo: "/icons/tech/gsap.svg", kind: "framework" },
  { name: "Framer Motion", logo: "/icons/tech/framer.svg", kind: "framework" },
  { name: "Redux", logo: "", kind: "framework" },
  { name: "Figma", logo: "/icons/tech/figma.svg", kind: "tool" },
  { name: "Git & GitHub", logo: "/icons/tech/git.svg", kind: "tool" },
  { name: "Docker", logo: "", kind: "tool" },
  { name: "MongoDB", logo: "", kind: "tool" },
  { name: "PostgreSQL", logo: "", kind: "tool" },
  { name: "MySQL", logo: "", kind: "tool" },
  { name: "Firebase", logo: "", kind: "tool" },
  { name: "Supabase", logo: "", kind: "tool" },
  { name: "GraphQL", logo: "", kind: "tool" },
  { name: "TensorFlow", logo: "", kind: "tool" },
  { name: "WordPress", logo: "", kind: "tool" },
  { name: "Flutter", logo: "", kind: "tool" },
  { name: "React Native", logo: "", kind: "tool" },
  { name: "Electron", logo: "", kind: "tool" },
  { name: "Vite", logo: "", kind: "tool" },
];

/** Case-insensitive lookup — lets the picker match "react" to "React". */
export function presetByName(name: string): TechPreset | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return TECH_PRESETS.find((p) => p.name.toLowerCase() === key) ?? null;
}
