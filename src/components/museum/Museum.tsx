"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, Code2, Layers3 } from "lucide-react";
import GlassModal from "@/components/GlassModal";
import TechnologyIcon from "@/components/TechnologyIcon";
import type { HomeVisibility } from "@/config/home-visibility";
import EditorialServices from "@/components/sections/EditorialServices";
import FeaturedGallery from "./FeaturedGallery";
import { isPublicStudioProject, isRaqibProject, studioProjectHighlights, studioProjectLink } from "@/lib/studio-projects";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SKILLS } from "@/components/sections/Skills";
import { projectCoverFor } from "@/data/project-covers";
import { techLogo } from "@/data/techLogos";
import { museumSkillAllowed } from "@/lib/museum-content";
import { editorialSkillAnchor } from "@/data/editorial-skills";
import { canonicalTechnology, skillMatchesTech } from "@/lib/skill-usage";
import { getProjectAvailability, projectPublicTags, type ProjectAvailability } from "@/lib/project-availability";
import type { RemoteContent } from "@/lib/content";
import "./museum.css";
import SkillRelics from "./SkillRelics";
import ProjectVitrines from "./ProjectVitrines";
import LuminousChain from "./LuminousChain";
import CinematicRail, { type RailItem } from "./CinematicRail";

type Hall = "projects" | "skills" | "certificates";
type Exhibit = {
  likes?: number;
  anchor?: string;
  key: string; name: string; subtitle?: string; description?: string; image?: string; pdf?: string;
  tags?: string[]; points?: string[]; github?: string; demo?: string; verify?: string;
  category?: string; date?: string; logo?: string; gallery?: string[]; status?: ProjectAvailability; deadline?: string; metadata?: { label: string; value: string }[];
  related?: { key: string; name: string }[];
};
const budiPortfolioStack = ["Next.js", "Tailwind CSS", "TypeScript", "Framer Motion", "GSAP", "Three.js", "Lenis"];
const halls: Hall[] = ["skills", "certificates"];
const icons = { projects: Layers3, skills: Code2, certificates: Award };
const certificateStudies = [
  { key: "english", recordId: "study-english", image: "/images/certificates/study-english.svg", provider: "AUC School of Continuing Education", en: "English language · B2 theme", fr: "Anglais · thème B2", detailEn: "English course pathway and CEFR level reference.", detailFr: "Parcours d’anglais et référence au niveau CECR.", href: "https://sce.aucegypt.edu/programs/english-courses" },
  { key: "microsoft", recordId: "study-microsoft", image: "/images/certificates/study-microsoft.svg", provider: "Microsoft Learn", en: "Technology learning paths", fr: "Parcours technologiques", detailEn: "Self-paced modules and guided learning paths.", detailFr: "Modules à votre rythme et parcours guidés.", href: "https://learn.microsoft.com/en-us/training/" },
  { key: "cybersecurity", recordId: "study-cyber", image: "/images/certificates/study-cyber.svg", provider: "Cisco Networking Academy", en: "Introduction to Cybersecurity", fr: "Introduction à la cybersécurité", detailEn: "Foundational cybersecurity course · 6 hours.", detailFr: "Cours de cybersécurité initial · 6 heures.", href: "https://www.netacad.com/courses/introduction-to-cybersecurity" },
] as const;
const collectionLabels: Record<"en" | "fr", Record<Hall, [string, string]>> = {
  en: { projects: ["Project", "Projects"], skills: ["Skill", "Skills"], certificates: ["Certificate", "Certificates"] },
  fr: { projects: ["Projet", "Projets"], skills: ["Compétence", "Compétences"], certificates: ["Certificat", "Certificats"] },
};
const skillColors: Record<string, string> = {
  react: "#61dafb", next: "#e9e9ee", javascript: "#f7df1e", typescript: "#3178c6", html: "#e34f26", css: "#1572b6", tailwind: "#38bdf8", node: "#5fa04e", python: "#3776ab", figma: "#a259ff", git: "#f05032", github: "#c9d1d9", supabase: "#3ecf8e", postgres: "#4169e1", mongodb: "#47a248", gsap: "#88ce02", motion: "#c2f970", wordpress: "#21759b", docker: "#2496ed", php: "#777bb4", sql: "#62b5e5",
};
function skillColorFor(name: string): string {
  const match = Object.entries(skillColors).find(([key]) => name.toLowerCase().includes(key));
  return match?.[1] ?? "#e8c37d";
}
const copy = {
  en: {
    kicker: "BUDI / CURATED COLLECTION", projects: "Project Gallery", skills: "The Skills Vault", certificates: "Certificate Gallery",
    descriptions: { projects: "Real projects, framed as stories you can explore.", skills: "A cabinet of tools that make the work possible.", certificates: "Explore each framed visual study and its story." },
    explore: "View exhibit", empty: "No published exhibits in this collection yet.", image: "Preview unavailable", details: "Exhibit details", original: "Open original", related: "Used in these projects", included: "What is included", browse: "Browse certificates", previous: "Previous certificate", next: "Next certificate", verify: "Verify credential", gallery: "Project images", overview: "Overview", position: "Exhibit", available: "Available", progress: "In progress", maintenance: "Maintenance", due: "Expected availability", arrows: "Use arrow keys to explore the cabinet", cabinet: "THE PROJECT CABINET",
  },
  fr: {
    kicker: "BUDI / COLLECTION CHOISIE", projects: "Galerie des projets", skills: "La voûte des compétences", certificates: "Galerie des certificats",
    descriptions: { projects: "De vrais projets présentés comme des histoires à explorer.", skills: "Une vitrine des outils qui donnent vie aux projets.", certificates: "Explorez chaque étude visuelle encadrée et son histoire." },
    explore: "Voir l’œuvre", empty: "Aucune œuvre publiée pour cette collection.", image: "Aucun aperçu disponible", details: "Détails de l’œuvre", original: "Ouvrir l’original", related: "Utilisée dans ces projets", included: "Ce qui est inclus", browse: "Parcourir les certificats", previous: "Certificat précédent", next: "Certificat suivant", verify: "Vérifier le certificat", gallery: "Images du projet", overview: "Présentation", position: "Œuvre", available: "Disponible", progress: "En cours", maintenance: "Maintenance", due: "Disponibilité prévue", arrows: "Utilisez les flèches pour parcourir la vitrine", cabinet: "LA VITRINE DES PROJETS",
  },
} as const;

export default function Museum({ content, visibility }: { content: RemoteContent | null; visibility: HomeVisibility }) {
  const { lang, t } = useLanguage();
  const c = copy[lang];
  const museumRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ hall: Hall; exhibit: Exhibit } | null>(null);
  const [selectedStudyKey, setSelectedStudyKey] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const root = museumRef.current;
    if (!root || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-lit"); observer.unobserve(entry.target); }
    }, { threshold: 0.08 });
    root.querySelectorAll(".museum-hall").forEach(hall => observer.observe(hall));
    root.classList.add("museum--enhanced");
    return () => observer.disconnect();
  }, []);
  const collections = useMemo<Record<Hall, Exhibit[]>>(() => {
    const projectRefs = content?.projects.filter(isPublicStudioProject).map(p => ({ key: p.id, name: lang === "fr" ? p.titleFr || p.title : p.title, tech: p.tech }))
      ?? t.projects.items.map((p, i) => ({ key: `project-${i}`, name: p.title, tech: p.tech }));
    const skills: Exhibit[] = (content?.skills ?? SKILLS).filter(s => ("visible" in s ? s.visible !== false : true) && museumSkillAllowed(s)).map((s, i) => ({
      key: "skill-" + ("id" in s ? s.id : i), anchor: editorialSkillAnchor("id" in s ? s.id : canonicalTechnology(s.name)), name: s.name, subtitle: s.cat,
      description: "detailEn" in s ? (lang === "fr" ? s.detailFr : s.detailEn) : s.detail[lang], logo: s.logo, category: s.cat,
      related: projectRefs.filter(p => p.tech.some(tech => skillMatchesTech(s.name, tech))).map(p => ({ key: p.key, name: p.name })),
    }));
    const flagshipRank = (project: { id: string; github?: string; title: string }) =>
      Number(isRaqibProject({ key: project.id, github: project.github, name: project.title }));
    const projects: Exhibit[] = content ? content.projects.filter(isPublicStudioProject)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || Number(!!b.featured) - Number(!!a.featured) || flagshipRank(b) - flagshipRank(a))
      .map(p => ({
      key: p.id, name: lang === "fr" ? p.titleFr || p.title : p.title, subtitle: p.category,
      description: lang === "fr" ? p.descFr || p.desc : p.desc, image: p.id === "proj-budi-s" ? "/brand/budi-light.svg" : /raqib/i.test(p.github + " " + p.id) ? "/images/projects/raqib-stage-mark.svg" : p.image || projectCoverFor(p.github), gallery: p.gallery, tags: p.id === "proj-budi-s" || /\/budi-s-\/?$/i.test(p.github) ? budiPortfolioStack : [...p.tech, ...projectPublicTags(p.tags)],
      likes: content.likes[p.github || p.title] ?? content.likes[p.id] ?? 0,
      github: studioProjectLink(p.github), demo: studioProjectLink(p.demo), category: p.category, date: p.year, status: getProjectAvailability(p).state, deadline: getProjectAvailability(p).deadline,
      points: (lang === "fr" ? p.briefFr : p.briefEn)?.length ? (lang === "fr" ? p.briefFr : p.briefEn) : studioProjectHighlights(p.github, lang),
      metadata: [
        { label: "Role", value: lang === "fr" ? p.roleFr : p.roleEn },
        { label: "Timeline", value: lang === "fr" ? p.timelineFr : p.timelineEn },
        { label: "Impact", value: lang === "fr" ? p.impactFr : p.impactEn },
        { label: "Version", value: p.version },
      ].filter(x => x.value),
    })) : t.projects.items.map((p, i) => ({ key: `project-${i}`, name: p.title, subtitle: p.category, description: p.desc, image: p.github.endsWith("/raqib") ? "/images/projects/raqib-stage-mark.svg" : projectCoverFor(p.github), demo: p.github.endsWith("/raqib") ? "https://raqibdev.vercel.app/" : undefined, tags: /\/budi-s-\/?$/i.test(p.github) ? budiPortfolioStack : p.tech, points: studioProjectHighlights(p.github, lang), github: studioProjectLink(p.github), category: p.category, date: p.year, status: p.status === "completed" ? "available" : "in-progress" }));
    const certificates: Exhibit[] = (content?.certs ?? []).filter(p => p.visible !== false && !p.id.startsWith("study-")).map(p => ({
      key: p.id, name: lang === "fr" ? p.titleFr || p.titleEn : p.titleEn,
      subtitle: lang === "fr" ? p.issuerFr || p.issuerEn : p.issuerEn, image: p.image, pdf: p.pdf,
      verify: p.verify, date: p.issueDate || p.year, tags: p.skills,
      metadata: [{ label: "Credential ID", value: p.code }, { label: "Type", value: p.type }, { label: "Expires", value: p.expiry }].filter(x => x.value),
    }));
    return { projects, skills, certificates };
  }, [content, lang, t]);

  const selectedIndex = selected ? collections[selected.hall].findIndex(item => item.key === selected.exhibit.key) : -1;
  const displayStudies = certificateStudies.flatMap(path => {
    const record = content?.certs.find(cert => cert.id === path.recordId && cert.visible !== false);
    return record ? [{ ...path, image: record.image || path.image, en: record.titleEn || path.en, fr: record.titleFr || path.fr }] : [];
  });
  const selectedStudy = displayStudies.find(path => path.key === selectedStudyKey);
  const moveCertificate = (step: number) => {
    if (!selected || selected.hall !== "certificates") return;
    setZoomed(false);
    const list = collections.certificates;
    const next = (selectedIndex + step + list.length) % list.length;
    setSelected({ hall: "certificates", exhibit: list[next] });
  };
  const studyIndex = displayStudies.findIndex(item => item.key === selectedStudyKey);
  const moveStudy = (step: number) => {
    const next = (studyIndex + step + displayStudies.length) % displayStudies.length;
    setZoomed(false);
    setSelectedStudyKey(displayStudies[next].key);
  };
  const archiveKeys = (event: React.KeyboardEvent, move: (step: number) => void) => {
    if (zoomed || event.altKey || event.ctrlKey || event.metaKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    move((event.key === "ArrowRight" ? 1 : -1) * (getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1));
  };
  const railItems: RailItem[] = [
    ...collections.projects.map((project, index) => ({
      id: `project-${project.key}`,
      label: project.name,
      number: String(index + 1).padStart(2, "0"),
    })),
  ];

  return <div ref={museumRef} className="museum museum--embedded astra-galleries" aria-label={c.kicker}>
    <EditorialServices content={content} visibility={visibility} email={content?.settings?.contactEmail} legacy />
    {visibility.projects && <div className="cine-showcase">
      <LuminousChain />
      <CinematicRail items={railItems} />
      <ProjectVitrines key="projects" items={collections.projects} labels={c} onOpen={exhibit => setSelected({ hall: "projects", exhibit })} />
    </div>}
    {halls.filter(hall => visibility[hall]).map(hall => {
      const Icon = icons[hall];
      const exhibits = collections[hall];
      const isConceptGallery = hall === "certificates" && exhibits.length === 0 && displayStudies.length > 0;
      const sectionCount = isConceptGallery ? displayStudies.length : exhibits.length;
      const countLabel = isConceptGallery ? (lang === "fr" ? (sectionCount === 1 ? "Étude visuelle" : "Études visuelles") : (sectionCount === 1 ? "Display study" : "Display studies")) : collectionLabels[lang][hall][sectionCount === 1 ? 0 : 1];
      return <section key={hall} id={hall} className={`museum-hall museum-hall--${hall}`} aria-labelledby={`${hall}-heading`}>
        <div className="museum-section-heading"><p className="museum-eyebrow"><Icon size={16} aria-hidden="true" /> {c.kicker}</p><h2 id={`${hall}-heading`}>{c[hall]}</h2><p>{hall === "certificates" && !sectionCount ? (lang === "fr" ? "Aucun certificat publié pour le moment." : "No published certificates yet.") : c.descriptions[hall]}</p><span className="museum-collection-count" role="status" aria-label={`${sectionCount} ${countLabel}`}><Icon size={18} aria-hidden="true" /><strong>{sectionCount.toLocaleString(lang)}</strong><small>{countLabel}</small></span></div>
        {hall === "skills" && exhibits.length ? <SkillRelics items={exhibits} label={c.explore} colorFor={skillColorFor} onOpen={exhibit => setSelected({ hall, exhibit })} /> : exhibits.length ? <div className={`museum-exhibits museum-exhibits-${hall}`}>
          <FeaturedGallery className="featured-archive archive-photo-exhibit" label={c.browse} names={exhibits.map(item => item.name)}
            peek={i => exhibits[i].image ? <img src={exhibits[i].image} alt="" loading="lazy" /> : <Award />}
            render={i => { const item = exhibits[i]; return <article className="museum-exhibit-shell">
            <button type="button" className="museum-exhibit" onClick={() => { setZoomed(false); setSelected({ hall, exhibit: item }); }} aria-haspopup="dialog">
              <span className="museum-exhibit-frame">{item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="museum-exhibit-placeholder"><Award size={48} aria-hidden="true" /><small>{item.pdf ? "PDF" : c.image}</small></span>}</span>
              <span className="museum-exhibit-plaque"><small>{[item.subtitle, item.date].filter(Boolean).join(" / ")}</small><strong>{item.name}</strong><span>{c.explore}<ArrowUpRight size={15} aria-hidden="true" /></span></span>
            </button>
          </article>; }} />
        </div> : isConceptGallery ? <div className="museum-learning" aria-label={lang === "fr" ? "Études visuelles de certificats, non délivrés" : "Certificate design studies, not issued"}>
          <div className="museum-learning-intro"><span>{lang === "fr" ? "DANS LE CADRE" : "BEHIND THE GLASS"}</span><p>{lang === "fr" ? "Trois études visuelles à explorer. Aucune n’est un certificat délivré." : "Explore three framed design studies. None is an issued credential."}</p></div>
          <FeaturedGallery className="featured-archive archive-photo-exhibit" label={c.browse} names={displayStudies.map(path => lang === "fr" ? path.fr : path.en)}
            peek={i => <img src={displayStudies[i].image} alt="" loading="lazy" />}
            render={i => { const path = displayStudies[i]; return <article className={`museum-learning-card museum-learning-card--${path.key}`} key={path.key}>
            <button type="button" className="museum-learning-open" onClick={() => { setZoomed(false); setSelectedStudyKey(path.key); }} aria-haspopup="dialog" aria-label={`${lang === "fr" ? "Voir les détails et ouvrir le cadre" : "View details and open frame"}: ${lang === "fr" ? path.fr : path.en}`}>
              <span className="museum-learning-art"><img src={path.image} alt={lang === "fr" ? `Étude visuelle pour ${path.fr}, non délivrée` : `Visual study for ${path.en}, not issued`} loading="lazy" /></span>
              <span className="museum-learning-info"><small>{path.provider}</small><strong>{lang === "fr" ? path.fr : path.en}</strong><span className="museum-learning-description">{lang === "fr" ? path.detailFr : path.detailEn}</span><span className="museum-learning-status">{lang === "fr" ? "Étude visuelle · Non délivrée" : "Display study · Not issued"}</span><span className="museum-learning-view">{lang === "fr" ? "Ouvrir le cadre et les détails" : "Open frame and details"} <ArrowUpRight size={15}/></span></span>
            </button>
            <a className="museum-learning-source" href={path.href} target="_blank" rel="noopener noreferrer">{lang === "fr" ? "Voir le programme officiel" : "Explore official program"} <ArrowUpRight size={15}/></a>
          </article>; }} />
        </div> : <div className="museum-empty"><div className="museum-empty-frame"><Icon size={44} aria-hidden="true"/><p>{c.empty}</p></div></div>}
      </section>;
    })}
    <GlassModal open={!!selected} onClose={() => setSelected(null)} label={selected?.exhibit.name ?? c.details} onPanelKeyDown={selected?.hall === "certificates" ? event => archiveKeys(event, moveCertificate) : undefined} wide accent={selected?.hall === "skills" ? "#72e8dd" : selected?.hall === "projects" ? "#d4b581" : selected?.hall === "certificates" ? "#ffd18a" : "#f39d78"}>
      {selected && <div className={`museum-detail museum-detail--${selected.hall}${selected.hall === "projects" ? " p1-modal-dossier" : ""}`}>
        <p className="museum-eyebrow">{c.kicker} / {c[selected.hall]}</p>
        <h2>{selected.exhibit.name}</h2>
        {selected.exhibit.subtitle && <p className="museum-detail-subtitle">{selected.exhibit.subtitle}</p>}
        {selected.exhibit.status && <span className={`museum-project-status museum-project-status--${selected.exhibit.status}`}>{selected.exhibit.status === "available" ? c.available : selected.exhibit.status === "maintenance" ? c.maintenance : c.progress}</span>}
        {selected.exhibit.deadline && selected.exhibit.status !== "available" && <p className="museum-detail-date">{c.due}: <time dateTime={selected.exhibit.deadline}>{selected.exhibit.deadline}</time></p>}
        {selected.hall === "certificates" && <div className="museum-certificate-browser">
          <div className="museum-certificate-toolbar"><span>{c.browse} · {selectedIndex + 1} / {collections.certificates.length}</span><div><button type="button" onClick={() => moveCertificate(-1)} aria-label={c.previous}><ArrowLeft size={18} /></button><button type="button" onClick={() => moveCertificate(1)} aria-label={c.next}><ArrowRight size={18} /></button></div></div>
          <div className="museum-certificate-page">{selected.exhibit.pdf ? <iframe src={selected.exhibit.pdf} title={selected.exhibit.name} /> : selected.exhibit.image ? <div className={`museum-archive-viewport${zoomed ? " is-zoomed" : ""}`} tabIndex={0} role="region" aria-label={selected.exhibit.name}><img src={selected.exhibit.image} alt={selected.exhibit.name} /></div> : <div className="museum-certificate-missing"><Award size={64} /><span>{c.image}</span></div>}</div>
          {!selected.exhibit.pdf && selected.exhibit.image && <button type="button" className="museum-study-glass-toggle" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? (lang === "fr" ? "Ajuster à la fenêtre" : "Fit to window") : (lang === "fr" ? "Agrandir le document" : "Zoom document")}</button>}
          <div className="museum-certificate-thumbs">{collections.certificates.map((cert, i) => <button type="button" key={cert.key} aria-current={i === selectedIndex ? "true" : undefined} onClick={() => { setZoomed(false); setSelected({ hall: "certificates", exhibit: cert }); }} title={cert.name}>{cert.image ? <img src={cert.image} alt="" loading="lazy" /> : <Award size={18} />}<span>{cert.name}</span></button>)}</div>
        </div>}
        {selected.hall === "projects" && selected.exhibit.image && <img className="museum-detail-image" src={selected.exhibit.image} alt={selected.exhibit.name} />}
        {selected.hall === "skills" && <div className="museum-detail-skill-icon"><TechnologyIcon name={selected.exhibit.name} src={selected.exhibit.logo} /></div>}
        {selected.exhibit.description && <><h3>{c.overview}</h3><p>{selected.exhibit.description}</p></>}
        {selected.exhibit.date && <p className="museum-detail-date">{selected.exhibit.date}</p>}
        {selected.exhibit.metadata?.length ? <dl className="museum-detail-meta">{selected.exhibit.metadata.map(meta => <div key={meta.label}><dt>{meta.label}</dt><dd>{meta.value}</dd></div>)}</dl> : null}
        {selected.exhibit.points?.length ? <><h3>{c.included}</h3><ul>{selected.exhibit.points.map((point, i) => <li key={i}>{point}</li>)}</ul></> : null}
        {selected.exhibit.tags?.length ? <div className="museum-detail-tags">{selected.exhibit.tags.map((tag, i) => <span key={`${tag}-${i}`}>{techLogo(tag) && <img src={techLogo(tag)!} alt="" loading="lazy" />}{tag}</span>)}</div> : null}
        {selected.exhibit.related?.length ? <><h3>{c.related} · {selected.exhibit.related.length}</h3><div className="museum-related-projects">{selected.exhibit.related.map(project => <button type="button" key={project.key} onClick={() => { const match = collections.projects.find(p => p.key === project.key); if (match) setSelected({ hall: "projects", exhibit: match }); }}>{project.name}<ArrowUpRight size={15} aria-hidden="true" /></button>)}</div></> : null}
        {selected.exhibit.gallery?.filter(Boolean).length ? <><h3>{c.gallery}</h3><div className="museum-detail-gallery">{selected.exhibit.gallery.filter(Boolean).map((src, i) => <a href={src} target="_blank" rel="noreferrer" key={`${src}-${i}`}><img src={src} alt={`${selected.exhibit.name} — ${i + 1}`} loading="lazy" /></a>)}</div></> : null}
        <div className="museum-detail-links">{selected.exhibit.github && <a href={selected.exhibit.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16} /></a>}{selected.exhibit.demo && <a href={selected.exhibit.demo} target="_blank" rel="noreferrer">Live Demo <ArrowUpRight size={16} /></a>}{selected.exhibit.verify && <a href={selected.exhibit.verify} target="_blank" rel="noreferrer">{c.verify} <ArrowUpRight size={16} /></a>}{(selected.exhibit.pdf || selected.hall === "certificates" && selected.exhibit.image) && <a href={selected.exhibit.pdf || selected.exhibit.image} target="_blank" rel="noreferrer">{c.original} <ArrowUpRight size={16} /></a>}</div>
      </div>}
    </GlassModal>
    <GlassModal open={!!selectedStudy} onClose={() => setSelectedStudyKey(null)} label={selectedStudy ? (lang === "fr" ? selectedStudy.fr : selectedStudy.en) : c.certificates} onPanelKeyDown={event => archiveKeys(event, moveStudy)} wide accent="#d7b679">
      {selectedStudy && <div className="museum-study-detail">
        <p className="museum-eyebrow">{c.certificates} / {lang === "fr" ? "Étude visuelle" : "Display study"}</p>
        <h2>{lang === "fr" ? selectedStudy.fr : selectedStudy.en}</h2>
        <div className="museum-certificate-toolbar"><span aria-live="polite">{c.browse} · {studyIndex + 1} / {displayStudies.length}</span><div><button type="button" onClick={() => moveStudy(-1)} aria-label={c.previous}><ArrowLeft size={18} /></button><button type="button" onClick={() => moveStudy(1)} aria-label={c.next}><ArrowRight size={18} /></button></div></div>
        <p className="museum-study-disclosure">{lang === "fr" ? "Création du portfolio · Aucun certificat délivré par l’organisme mentionné." : "Portfolio artwork · No credential was issued by the referenced organization."}</p>
        <div className={`museum-archive-viewport${zoomed ? " is-zoomed" : ""}`} tabIndex={0} role="region" aria-label={lang === "fr" ? "Aperçu du document" : "Document preview"}><div className="museum-study-wood-frame">
          <img src={selectedStudy.image} alt={lang === "fr" ? `Aperçu intégral de ${selectedStudy.fr}, étude visuelle non délivrée` : `Full preview of ${selectedStudy.en}, unissued visual study`} />
        </div></div>
        <button type="button" className="museum-study-glass-toggle" onClick={() => { setZoomed(value => !value); }} aria-pressed={zoomed}>{zoomed ? (lang === "fr" ? "Ajuster à la fenêtre" : "Fit to window") : (lang === "fr" ? "Agrandir le document" : "Zoom document")}</button>
        <dl className="museum-study-facts"><div><dt>{lang === "fr" ? "Référence" : "Reference"}</dt><dd>{selectedStudy.provider}</dd></div><div><dt>{lang === "fr" ? "Parcours" : "Program"}</dt><dd>{lang === "fr" ? selectedStudy.detailFr : selectedStudy.detailEn}</dd></div><div><dt>{lang === "fr" ? "Statut" : "Status"}</dt><dd>{lang === "fr" ? "Étude visuelle, non délivrée" : "Design study, not issued"}</dd></div><div><dt>{lang === "fr" ? "Création" : "Artwork"}</dt><dd>BUDI Portfolio</dd></div></dl>
        <a className="museum-study-program" href={selectedStudy.href} target="_blank" rel="noopener noreferrer">{lang === "fr" ? "Voir le programme officiel" : "Explore official program"} <ArrowUpRight size={16}/></a>
      </div>}
    </GlassModal>
  </div>;
}
