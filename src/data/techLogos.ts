/** Shared tech-logo map — Services tags, Hero marquee and anywhere a skill
 *  should show its mark instead of its name. Returns null when unknown. */

const TECH_LOGOS: Record<string, string> = {
  react: "/icons/tech/react.svg",
  "next.js": "/icons/tech/nextjs.svg",
  nextjs: "/icons/tech/nextjs.svg",
  next: "/icons/tech/nextjs.svg",
  typescript: "/icons/tech/typescript.svg",
  ts: "/icons/tech/typescript.svg",
  javascript: "/icons/tech/javascript.svg",
  js: "/icons/tech/javascript.svg",
  "tailwind css": "/icons/tech/tailwind.svg",
  tailwind: "/icons/tech/tailwind.svg",
  "node.js": "/icons/tech/nodejs.svg",
  nodejs: "/icons/tech/nodejs.svg",
  node: "/icons/tech/nodejs.svg",
  html: "/icons/tech/html.svg",
  html5: "/icons/tech/html.svg",
  css: "/icons/tech/css.svg",
  css3: "/icons/tech/css.svg",
  git: "/icons/tech/git.svg",
  github: "/icons/tech/git.svg",
  "git & github": "/icons/tech/git.svg",
  gsap: "/icons/tech/gsap.svg",
  framer: "/icons/tech/framer.svg",
  "framer motion": "/icons/tech/framer.svg",
  figma: "/icons/tech/figma.svg",
};

export function techLogo(tag: string): string | null {
  const key = tag.trim().toLowerCase();
  return TECH_LOGOS[key] ?? null;
}

/** The full 12-skill arsenal — Services strip, showcases, anywhere. */
export const TECH_STACK: { name: string; logo: string }[] = [
  { name: "React", logo: "/icons/tech/react.svg" },
  { name: "Next.js", logo: "/icons/tech/nextjs.svg" },
  { name: "TypeScript", logo: "/icons/tech/typescript.svg" },
  { name: "JavaScript", logo: "/icons/tech/javascript.svg" },
  { name: "Tailwind CSS", logo: "/icons/tech/tailwind.svg" },
  { name: "HTML", logo: "/icons/tech/html.svg" },
  { name: "CSS", logo: "/icons/tech/css.svg" },
  { name: "GSAP", logo: "/icons/tech/gsap.svg" },
  { name: "Framer Motion", logo: "/icons/tech/framer.svg" },
  { name: "Node.js", logo: "/icons/tech/nodejs.svg" },
  { name: "Git & GitHub", logo: "/icons/tech/git.svg" },
  { name: "Figma", logo: "/icons/tech/figma.svg" },
];
