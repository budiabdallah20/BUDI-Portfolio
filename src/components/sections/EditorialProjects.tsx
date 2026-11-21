"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { showcaseProjects, projectAnchor, projectSlug } from "@/data/showcase-projects";
import type { Lang } from "@/i18n/dictionaries";
import type { RemoteContent } from "@/lib/content";
import { projectMedia, ProjectLinks, statusFor, type Project } from "./ProjectPresentation";
import { ProjectVisual } from "./ProjectVisual";
import ShowcaseLike from "./ShowcaseLike";
import { ProjectChain } from "./ProjectChain";
import "./project-gallery.css";

const copy = {
  en: {
    title: ["Ideas made", "real"],
    count: "Published projects", all: "All work", filters: "Filter projects by category", featured: "Featured project",
    study: "Read case study", preview: "Project preview", empty: "No published projects.", shown: "Projects shown",
  },
  fr: {
    title: ["Des idées", "concrètes"],
    count: "Projets publiés", all: "Tous les projets", filters: "Filtrer les projets par catégorie", featured: "Projet à la une",
    study: "Lire l’étude de cas", preview: "Aperçu du projet", empty: "Aucun projet publié.", shown: "Projets affichés",
  },
};

function ProjectCard({ project, featured, lang, hidden, ordinal }: {
  project: Project;
  featured: boolean;
  lang: Lang;
  hidden: boolean;
  ordinal: number;
}) {
  const anchor = projectAnchor(project.key);
  const words = copy[lang];
  const fr = lang === "fr";
  const tech = [...new Set(project.tech)];
  const shownTech = tech.slice(0, featured ? 5 : 4);
  const href = `/${lang}/projects/${encodeURIComponent(projectSlug(project))}`;

  return (
    <article id={anchor} tabIndex={-1} hidden={hidden} aria-labelledby={anchor + "-title"}
      className="work-card" data-featured={featured}>
      <div className="work-card-bar">
        <span className="work-card-id"><b className="work-card-ordinal" aria-hidden="true">{String(ordinal).padStart(2, "0")}</b>{featured ? words.featured : project.category}</span>
        <span>{project.year}</span>
      </div>
      <ProjectVisual source={projectMedia(project)} title={project.title} category={project.category}
        caption={`${words.preview} · ${project.title}`} phone={featured && project.raqib} wide={featured} />
      <div className="work-card-body">
        <p className="work-status" data-status={project.status}>
          {featured && project.category && <span>{project.category}</span>}
          <span>{statusFor(project, fr)}</span>
        </p>
        <h3 id={anchor + "-title"}>{project.title}</h3>
        <p className="work-summary">{project.summary}</p>
        {!!shownTech.length && <ul className="work-stack" aria-label="Technologies">
          {shownTech.map(name => <li key={name}>{name}</li>)}
          {tech.length > shownTech.length && <li>+{tech.length - shownTech.length}</li>}
        </ul>}
        <div className="work-card-actions">
          <Button asChild className="work-primary">
            <Link href={href} aria-label={`${words.study} · ${project.title}`}>
              {words.study}<ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <ProjectLinks project={project} lang={lang} />
          <ShowcaseLike id={project.likeId} total={project.likes} fr={fr} />
        </div>
      </div>
    </article>
  );
}

export default function EditorialProjects({ content }: { content: RemoteContent | null }) {
  const { lang, t } = useLanguage();
  const words = copy[lang];
  const projects = useMemo(() => showcaseProjects(content, lang), [content, lang]);
  const featured = projects.find(project => project.featured && project.gallery.length) ||
    projects.find(project => project.raqib) || projects.find(project => project.featured && projectMedia(project));
  const ordered = featured ? [featured, ...projects.filter(project => project !== featured)] : projects;
  const [filter, setFilter] = useState<string | null>(null);
  const pendingTarget = useRef<HTMLElement | null>(null);
  const categories = new Map<string, number>();
  for (const { category } of projects) {
    if (category) categories.set(category, (categories.get(category) ?? 0) + 1);
  }
  const active = filter && categories.has(filter) ? filter : null;
  const visible = active ? ordered.filter(project => project.category === active) : ordered;
  const ordinals = new Map(visible.map((project, index) => [project.key, index + 1]));
  const visibleCount = visible.length;

  function selectCategory(category: string | null) {
    const target = projects.find(project => "#" + projectAnchor(project.key) === window.location.hash);
    if (category && target && target.category !== category) {
      const url = new URL(window.location.href);
      url.hash = "projects";
      window.history.replaceState(window.history.state, "", url);
    }
    setFilter(category);
  }

  useEffect(() => {
    const revealHashTarget = () => {
      const id = window.location.hash.slice(1);
      const target = document.getElementById(id);
      if (!target?.matches("#projects .work-card")) return;
      if (target.hidden) {
        pendingTarget.current = target;
        setFilter(null);
      }
    };
    window.addEventListener("hashchange", revealHashTarget);
    revealHashTarget();
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, []);

  useEffect(() => {
    const target = pendingTarget.current;
    if (!target || active || target.hidden) return;
    pendingTarget.current = null;
    if (window.location.hash === "#" + target.id) {
      target.scrollIntoView({ behavior: "instant" });
      target.focus({ preventScroll: true });
    }
  }, [active]);

  return (
    <section className="work-gallery" id="projects" aria-labelledby="work-title">
      <div className="work-wrap">
        <header className="work-masthead">
          <div className="work-header-label"><span>{t.nav.projects}</span><ArrowDownRight aria-hidden="true" size={18} /></div>
          <div className="work-header-layout">
            <h2 id="work-title">{words.title[0]} <em>{words.title[1]}</em></h2>
            <div className="work-header-note">
              <p className="work-count"><strong>{String(projects.length).padStart(2, "0")}</strong>{words.count}</p>
            </div>
          </div>
        </header>

        <div className="work-exhibition">
          {categories.size > 1 && (
            <div className="work-filter-strip">
              <div className="work-filters" role="group" aria-label={words.filters}>
                <Button type="button" variant="ghost" aria-pressed={!active} onClick={() => selectCategory(null)}>
                  {words.all}<span>{projects.length}</span>
                </Button>
                {[...categories].map(([category, count]) => (
                  <Button key={category} type="button" variant="ghost" aria-pressed={active === category}
                    onClick={() => selectCategory(category)}>{category}<span>{count}</span></Button>
                ))}
              </div>
              <span className="sr-only" role="status">{words.shown} · {visibleCount}</span>
            </div>
          )}
          <div className="work-grid">
            <ProjectChain layoutKey={JSON.stringify([...ordinals.keys()])} />
            {ordered.map(project => (
              <ProjectCard key={project.key} project={project} featured={project === featured}
                lang={lang} hidden={!ordinals.has(project.key)} ordinal={ordinals.get(project.key) ?? 0} />
            ))}
          </div>
          {!projects.length && <p className="work-empty">{words.empty}</p>}
        </div>
      </div>
    </section>
  );
}
