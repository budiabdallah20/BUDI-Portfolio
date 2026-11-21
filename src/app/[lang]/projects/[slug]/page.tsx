import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { studioServices } from "@/data/studio-services";
import { editorialSkills } from "@/data/editorial-skills";
import { fetchContent } from "@/lib/content";
import { canonicalTechnology } from "@/lib/skill-usage";
import { isLang } from "@/i18n/dictionaries";
import { projectSlug, showcaseProjects } from "@/data/showcase-projects";
import { Button } from "@/components/ui/button";
import {
  isProjectMedia, portfolioFeatures, projectMedia, ProjectLinks, ProjectLogo, raqibPhone, Technologies, statusFor, storyFor,
} from "@/components/sections/ProjectPresentation";
import { ProjectVisual } from "@/components/sections/ProjectVisual";
import "@/components/sections/project-gallery.css";
import "./case-study.css";

type Props = { params: Promise<{ lang: string; slug: string }> };
export const dynamic = "force-dynamic";

const resolve = cache(async (lang: string, slug: string) => {
  if (!isLang(lang)) notFound();
  const content = await fetchContent();
  const projects = showcaseProjects(content, lang);
  const index = projects.findIndex(project => projectSlug(project) === slug);
  if (index < 0) notFound();
  return { lang, content, project: projects[index], next: projects[index + 1] };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const { project } = await resolve(lang, slug);
  const suffix = "/projects/" + encodeURIComponent(projectSlug(project));
  const url = siteConfig.url + "/" + lang + suffix;
  const description = project.summary;
  const image = projectMedia(project);
  return {
    title: project.title, description,
    alternates: { canonical: url, languages: { en: siteConfig.url + "/en" + suffix, fr: siteConfig.url + "/fr" + suffix } },
    openGraph: { title: project.title, description, url, images: image ? [image] : undefined, type: "article" },
  };
}

export default async function CaseStudy({ params }: Props) {
  const route = await params;
  const { lang, content, project, next } = await resolve(route.lang, route.slug);
  const fr = lang === "fr";
  const story = storyFor(project, lang);
  const hero = projectMedia(project);
  const features = project.budi ? portfolioFeatures[lang] : project.points;
  const gallery = [...new Set([...(project.raqib ? [raqibPhone] : []), ...project.gallery])]
    .filter(src => src !== hero && isProjectMedia(src));
  const service = studioServices.find(item => item.projectId === projectSlug(project));
  const stack = new Set(project.tech.map(canonicalTechnology));
  const relatedSkill = content && editorialSkills(content, lang).find(skill => stack.has(skill.technology));
  const caseHref = (slug: string, target = lang) => "/" + target + "/projects/" + encodeURIComponent(slug);
  const homeHref = (section: string, anchor = section) => "/" + lang +
    (process.env.NODE_ENV === "development" && ["skills", "contact"].includes(section) ? "?sections=" + section : "") +
    "#" + anchor;
  const labels = fr ? {
    back: "Retour aux projets", case: "Étude de cas", preview: "Aperçu du projet", chapters: "Sommaire",
    category: "Catégorie", role: "Contribution", year: "Année", time: "Calendrier", deadline: "Date prévue", status: "État actuel",
    overview: "Vue d’ensemble", challenge: "Enjeu", solution: "Approche", features: "Fonctionnalités", architecture: "Architecture et technologies",
    decisions: "Décisions de conception", gallery: "Galerie du projet", image: "Ouvrir l’image", services: "Service associé",
    skills: "Compétences associées", contact: "Parlons de votre projet", next: "Projet suivant",
  } : {
    back: "Back to projects", case: "Case study", preview: "Project preview", chapters: "Chapters",
    category: "Category", role: "Contribution", year: "Year", time: "Timeline", deadline: "Expected date", status: "Current status",
    overview: "Overview", challenge: "The challenge", solution: "Approach", features: "Capabilities", architecture: "Architecture & stack",
    decisions: "Design decisions", gallery: "Project gallery", image: "Open image", services: "Related service",
    skills: "Related skills", contact: "Discuss your project", next: "Next project",
  };
  const projectStatus = statusFor(project, fr);
  const facts = [
    [labels.category, project.category], [labels.status, projectStatus], [labels.role, project.role],
    [labels.year, project.year], [labels.time, project.timeline], [labels.deadline, project.deadline],
  ].filter(([, value]) => !!value);
  const hasArchitecture = Boolean(story || project.tech.length || project.budi);
  const chapters = [
    ["overview", labels.overview, true],
    ["features", labels.features, Boolean(features?.length)],
    ["architecture", labels.architecture, hasArchitecture],
    ["decisions", labels.decisions, Boolean(story)],
    ["gallery", labels.gallery, Boolean(gallery.length)],
    ["status", labels.status, true],
  ] as const;

  return (
    <main className="project-case">
      <div className="case-reading-line" aria-hidden="true" />
      <div className="case-shell">
        <header className="case-utility">
          <Link href={homeHref("projects")}><ArrowLeft size={17} aria-hidden="true" />{labels.back}</Link>
          <div className="project-actions">
            {(["en", "fr"] as const).filter(target => target !== lang).map(target =>
              <Link key={target} href={caseHref(projectSlug(project), target)} hrefLang={target}>
                {{ en:"English", fr:"Français" }[target]}
              </Link>
            )}
          </div>
        </header>

        <header className="case-intro">
          <div className="case-identity">
            <p className="case-label">{labels.case}</p>
            <h1>{project.title}</h1>
            <p className="case-lead">{project.summary}</p>
            <div className="project-actions"><ProjectLinks project={project} lang={lang} /></div>
          </div>
          <dl className="case-facts">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </header>

        <div className="case-hero-frame">
          <ProjectVisual source={hero} title={project.title} category={project.category}
            caption={`${labels.preview} · ${project.title}`} phone={project.raqib} eager wide />
        </div>
        <nav className="case-chapters" aria-label={labels.chapters}>
          {chapters.map(([id, label, available]) => available &&
            <a key={id} href={"#" + id}>{label}<ArrowDownRight size={13} aria-hidden="true" /></a>)}
        </nav>

        <div className="case-content">
          <section id="overview">
            <h2>{labels.overview}</h2>
            {story ? <dl className="case-story">
              <div><dt>{labels.challenge}</dt><dd>{story[0]}</dd></div>
              <div><dt>{labels.solution}</dt><dd>{story[1]}</dd></div>
            </dl> : <p>{project.summary}</p>}
          </section>
          {!!features?.length && <section id="features">
            <h2>{labels.features}</h2>
            <ul className="case-feature-grid">{features.map((feature, index) => <li key={feature}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{feature}
            </li>)}</ul>
          </section>}
          {hasArchitecture && <section id="architecture">
            <h2>{labels.architecture}</h2>
            {story && <p>{story[2]}</p>}
            <Technologies project={project} />
            {stack.size > 0 && <a className="project-text-action" href={homeHref("skills", relatedSkill?.anchor)}>
              {labels.skills}<ArrowUpRight size={15} aria-hidden="true" />
            </a>}
          </section>}
          {story && <section id="decisions"><h2>{labels.decisions}</h2><p>{story[3]}</p></section>}
          {!!gallery.length && <section id="gallery">
            <h2>{labels.gallery}</h2>
            <div className="case-media-grid">
              {gallery.map((src, index) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" aria-label={`${labels.image} ${index + 1}`}>
                  <ProjectVisual source={src} title={project.title} caption={`${labels.preview} · ${project.title} · ${index + 1}`} />
                </a>
              ))}
            </div>
          </section>}
          <section id="status">
            <h2>{labels.status}</h2>
            <p>{projectStatus}</p>
            {project.impact && <p>{project.impact}</p>}
            {service && <a className="project-text-action" href={homeHref("services", "explore-" + service.key)}>
              {labels.services} · {service[lang].name}<ArrowUpRight size={15} aria-hidden="true" />
            </a>}
          </section>
        </div>
        <footer className="case-final">
          <div className="case-footer-brand"><ProjectLogo project={project} />
            <Button asChild className="work-primary"><Link href={homeHref("contact")}>{labels.contact}<ArrowUpRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="project-actions">
            <ProjectLinks project={project} lang={lang} />
            <Link className="project-text-action" href={homeHref("projects")}>{labels.back}</Link>
          </div>
          {next && <Link className="case-next" href={caseHref(projectSlug(next))}>
            <span className="case-label">{labels.next}</span><strong>{next.title}</strong><ArrowUpRight aria-hidden="true" />
          </Link>}
        </footer>
      </div>
    </main>
  );
}
