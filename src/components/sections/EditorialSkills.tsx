"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { Dialog } from "radix-ui";
import TechnologyIcon from "@/components/TechnologyIcon";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { homeSectionHref, type HomeVisibility } from "@/config/home-visibility";
import { skillMatchesTech } from "@/lib/skill-usage";
import { editorialSkills } from "@/data/editorial-skills";
import { projectAnchor, showcaseProjects } from "@/data/showcase-projects";
import type { RemoteContent } from "@/lib/content";
import ShowcaseSection from "./ShowcaseSection";
import "./dark-studio.css";
import "./skill-dossier.css";

const accents: Record<string, string> = {
  motion: "#b083ff", figma: "#ff6c86", javascript: "#f7d544", gsap: "#9cfe59",
  html: "#ff793d", css: "#a989ff", node: "#8cda67", react: "#63dbff", typescript: "#58a8ff",
  "git-github": "#ff7658", next: "#d6dadd", tailwind: "#5bd2ef", supabase: "#55f0ab",
  vercel: "#f1e9ff", canva: "#46e2d3",
};

const copy = {
  en: {
    label: "Skills",
    level: "Self-assessed level", mastered: "Proficient", learning: "Learning", count: "Published projects", details:"What I work on",
    proof:"Project evidence", empty:"This skill has no published project match yet.", close:"Close skill details",
    years:"Years of practice", frontend:"Front-end", backend:"Back-end & data", tools:"Design & tools", life:"Other",
  },
  fr: {
    label: "Compétences",
    level:"Niveau autoévalué", mastered:"Maîtrisé", learning:"En apprentissage", count:"Projets publiés", details:"Ma pratique",
    proof:"Projets associés", empty:"Aucun projet publié ne mentionne encore cette compétence.", close:"Fermer la fiche",
    years:"Années de pratique", frontend:"Front-end", backend:"Back-end et données", tools:"Design et outils", life:"Autres",
  },
} as const;

export default function EditorialSkills({ content, visibility }: { content: RemoteContent | null; visibility?: HomeVisibility }) {
  const { lang } = useLanguage();
  const words = copy[lang];
  const projects = showcaseProjects(content, lang);
  const skills = editorialSkills(content, lang);
  const number = new Intl.NumberFormat(lang);
  return <ShowcaseSection id="skills" number="05" count={skills.length} label={words.label}
    title={lang === "fr" ? "Outils et savoir-faire" : "Tools of the trade"}>
    <div className="showcase-skill-grid obsidian-skills skills-glass-grid" data-showcase-reveal>
        {skills.map(skill => {
          const related = projects.filter(project => project.tech.some(tag => skillMatchesTech(skill.name, tag)));
          const proficient = skill.cat === "frontend";
          const state = proficient ? words.mastered : words.learning;
          return <Dialog.Root key={skill.anchor}>
            <Dialog.Trigger asChild>
              <button type="button" id={skill.anchor} style={{ "--skill-accent": accents[skill.technology] ?? "#ffa369" } as CSSProperties} onPointerMove={event => {
                if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                const card = event.currentTarget;
                const box = card.getBoundingClientRect();
                card.style.setProperty("--skill-spot-x", `${event.clientX - box.left}px`);
                card.style.setProperty("--skill-spot-y", `${event.clientY - box.top}px`);
              }}>
                <span className="showcase-skill-mark" data-tech={skill.name}><TechnologyIcon name={skill.name} src={skill.logo} /></span>
                <span>{skill.name}</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="skills-dossier-overlay" />
              <Dialog.Content className="skills-dossier" aria-describedby={undefined}>
                <header className="skills-dossier-header">
                  <div className="skills-mark"><TechnologyIcon name={skill.name} src={skill.logo} /></div>
                  <div><p>{words[skill.cat]}</p><Dialog.Title>{skill.name}</Dialog.Title></div>
                  <Dialog.Close asChild><button type="button" className="skills-close" aria-label={words.close}><X size={21} aria-hidden="true" /></button></Dialog.Close>
                </header>
                <div className="skills-dossier-body">
                  <div className="skills-dossier-metrics">
                    <div><span>{words.level}</span><strong data-proficient={proficient}>{state}</strong>
                      {skill.level !== undefined && <div className="skills-level-meter"><meter min={0} max={100} value={skill.level} aria-label={words.level} /><small>{number.format(skill.level)}%</small></div>}
                    </div>
                    <div><span>{words.count}</span><strong>{number.format(related.length)}</strong></div>
                    {skill.years !== undefined && <div><span>{words.years}</span><strong>{number.format(skill.years)}</strong></div>}
                  </div>
                  {skill.detail && <div className="skills-dossier-story"><h3>{words.details}</h3><p>{skill.detail}</p></div>}
                  <div className="skills-dossier-projects">
                    <h3>{words.proof}</h3>
                    {related.length ? <ul>{related.map(project => <li key={project.key}>
                      <Dialog.Close asChild><a href={homeSectionHref("#"+projectAnchor(project.key), visibility, "projects")}>
                        <span><strong>{project.title}</strong><small>{project.category}{project.year ? " · " + project.year : ""}</small></span>
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </a></Dialog.Close>
                    </li>)}</ul> : <p>{words.empty}</p>}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>;
        })}
    </div>
  </ShowcaseSection>;
}
