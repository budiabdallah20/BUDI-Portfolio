import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Logo from "@/components/Logo";
import { techLogo } from "@/data/techLogos";
import type { showcaseProjects } from "@/data/showcase-projects";
export type Project = ReturnType<typeof showcaseProjects>[number];
export const budiHero = "/images/projects/budi-studio-hero.webp";
export const raqibHero = "/images/projects/death-raqib-desktop.webp";
export const raqibPhone = "/images/projects/death-raqib-mobile.webp";
export function isProjectMedia(source: string | undefined): source is string {
  return !!source && /^(?:\/(?!\/)|https?:\/\/)/i.test(source);
}

export function projectMedia(project: Project) {
  if (project.raqib) return raqibHero;
  if (project.budi) return budiHero;
  return project.gallery.find(isProjectMedia) || project.cover;
}
const portfolioStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP", "Motion", "Supabase"];
const extraMarks: Record<string,string> = { Prisma:"/icons/tech/prisma.svg", Supabase:"/icons/tech/supabase.svg" };
export const portfolioFeatures = {
  en: ["Bilingual project and skill galleries", "Case studies with authentic project previews", "Contact, résumé and support information"],
  fr: ["Galeries bilingues de projets et de compétences", "Études de cas avec aperçus réels", "Coordonnées, CV et informations de soutien"],
};

const stories = {
  budi: {
    en: ["A portfolio needs to make the work easy to find while showing how the interface itself was built.", "Give visitors a direct path to projects, skills and contact.", "Localized Next.js routes, an editorial React interface and Supabase-backed content.", "Coordinate entrances with GSAP and keep the same reading order with reduced motion."],
    fr: ["Un portfolio doit rendre les projets faciles à trouver et démontrer le soin apporté à son interface.", "Faciliter l’accès aux projets, compétences et coordonnées.", "Routes Next.js localisées, interface éditoriale React et contenu géré avec Supabase.", "Coordonner les entrées avec GSAP et préserver l’ordre de lecture en mouvement réduit."],
  },
  raqib: {
    en: ["Attendance, scheduling and grades serve different academic roles.", "Bring academic operations into one role-aware interface.", "Student, professor and administrator workflows connect attendance, lectures, schedules and grades.", "Organize access by role so each group reaches the tools it needs."],
    fr: ["Les présences, les plannings et les notes concernent des rôles différents.", "Regrouper les opérations académiques dans une interface adaptée aux rôles.", "Des espaces étudiants, enseignants et administrateurs relient présences, cours, plannings et notes.", "Structurer les accès afin que chaque rôle retrouve ses outils."],
  },
  dental: {
    en: ["Booking, patient administration and billing are connected parts of a clinic’s work.", "Bring those workflows together while offering patients online booking.", "Patient booking and staff administration cover appointments, patient records and billing.", "Separate the patient-facing booking flow from the operational tools used by the practice."],
    fr: ["Les rendez-vous, la gestion des patients et la facturation sont liés dans le travail du cabinet.", "Relier ces parcours et proposer la réservation en ligne aux patients.", "La réservation et l’administration couvrent les rendez-vous, dossiers patients et la facturation.", "Distinguer la réservation côté patient des outils de gestion du cabinet."],
  },
};

export function storyFor(project: Project, lang: "en" | "fr") {
  if (project.budi) return stories.budi[lang];
  if (project.raqib) return stories.raqib[lang];
  if (/dental/i.test(project.key + " " + project.title)) return stories.dental[lang];
}

function getDemo(project: Project, lang: "en" | "fr") {
  return project.budi ? `https://budi-portfolio-dev.vercel.app/${lang}` : project.demo;
}

export function statusFor(project: Project, fr: boolean) {
  return project.status === "available" ? (fr ? "Disponible" : "Available") :
    project.status === "maintenance" ? "Maintenance" : (fr ? "En cours" : "In progress");
}

function Badge({ children, brand }: { children: ReactNode; brand?: string }) {
  return <span className="studio-badge" data-brand={brand}>{children}</span>;
}

export function Technologies({ project }: { project: Project }) {
  const names = project.budi ? portfolioStack : project.tech;
  return <ul className="studio-badges" aria-label="Technologies">{Array.from(new Set(names)).map(name => {
    const mark = techLogo(name) || extraMarks[name];
    return <li key={name}><Badge brand={name}>{mark && <img src={mark} alt="" width={16} height={16} loading="lazy" />}{name}</Badge></li>;
  })}</ul>;
}

export function ProjectLogo({ project }: { project: Project }) {
  const src = project.raqib ? "/images/projects/raqib-official-wordmark.svg" :
    /dental/i.test(project.key + " " + project.title) ? "/images/projects/budi-dental.svg" : undefined;
  return project.budi ? <Logo className="studio-logo" variant="full" /> :
    src ? <span className="studio-logo" aria-hidden="true"><img src={src} alt="" width={63} height={31} loading="lazy" /></span> : null;
}

export function ProjectLinks({ project, lang }: { project: Project; lang: "en" | "fr" }) {
  const demo = getDemo(project, lang);
  const repo = project.budi ? "https://github.com/budiabdallah20/BUDI-Portfolio" : project.repo;
  return (
    <div className="project-actions-cluster" role="group" aria-label={lang === "fr" ? "Actions du projet" : "Project actions"}>
      {demo && /^https?:\/\//i.test(demo) && (
        <a
          className="project-action-demo"
          href={demo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${lang === "fr" ? "Démo en direct" : "Live Demo"} — ${project.title}`}
        >
          <span>{lang === "fr" ? "Démo en direct" : "Live Demo"}</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      )}
      {repo && /^https?:\/\//i.test(repo) && (
        <a
          className="project-action-repo"
          href={repo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${lang === "fr" ? "Voir le code" : "View Repository"} — ${project.title}`}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="project-repo-glyph">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>{lang === "fr" ? "Voir le code" : "View Repository"}</span>
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
