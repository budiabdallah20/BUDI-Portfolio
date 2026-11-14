"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  Boxes,
  BriefcaseBusiness,
  Cat,
  Code2,
  Gem,
  Landmark,
  Layers3,
  Mail,
  Medal,
  MessageCircle,
  Monitor,
  Orbit,
  Sparkles,
  Tablet,
  Wrench,
} from "lucide-react";
import TechnologyIcon from "@/components/TechnologyIcon";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SKILLS } from "@/components/sections/Skills";
import { profile } from "@/data/portfolio";
import { projectCoverFor } from "@/data/project-covers";
import { BUDI_MARK_PATH } from "@/lib/brand";
import { museumServiceAllowed, museumSkillAllowed } from "@/lib/museum-content";
import { getProjectAvailability } from "@/lib/project-availability";
import type { RemoteContent } from "@/lib/content";
import "./scrollplay.css";

type ChapterId = "gate" | "skills" | "projects" | "services" | "archive" | "corridor" | "collection";
type ProjectState = "available" | "maintenance" | "in-progress";

const artifactIcons = [Cat, Landmark, Tablet, Gem, Medal, Orbit];
const hallIcons: Record<ChapterId, typeof Gem> = {
  gate: Landmark,
  skills: Code2,
  projects: Layers3,
  services: BriefcaseBusiness,
  archive: Award,
  corridor: Mail,
  collection: Sparkles,
};

const studyFrames = [
  { key: "english", image: "/images/certificates/study-english.svg", en: "English language · B2 theme", fr: "Anglais · thème B2", provider: "AUC School of Continuing Education" },
  { key: "microsoft", image: "/images/certificates/study-microsoft.svg", en: "Technology learning paths", fr: "Parcours technologiques", provider: "Microsoft Learn" },
  { key: "cyber", image: "/images/certificates/study-cyber.svg", en: "Introduction to Cybersecurity", fr: "Introduction à la cybersécurité", provider: "Cisco Networking Academy" },
  { key: "network", image: "/images/certificates/study-network.svg", en: "Networking Basics", fr: "Fondamentaux des réseaux", provider: "Cisco Networking Academy" },
];

function countLabel(pair: readonly [string, string], value: number): string {
  return value === 1 ? pair[0] : pair[1];
}

function statusLabel(state: ProjectState, fr: boolean): string {
  if (state === "available") return fr ? "Disponible" : "Available";
  if (state === "maintenance") return fr ? "Maintenance" : "Maintenance";
  return fr ? "En cours" : "In progress";
}

function serviceIcon(name: string, category: string): typeof Monitor {
  if (/maintenance|support|care|assistance/i.test(name)) return Wrench;
  if (/system|backend|database|api|automation/i.test(name) || category === "backend") return Boxes;
  if (/design|ui|ux|front/i.test(name) || category === "design") return Layers3;
  if (/ai|intelligence/i.test(name)) return Sparkles;
  return Monitor;
}

/** A scroll-controlled 2.5D museum tour. Scroll position is the camera; the
 *  page is never hijacked. On compact screens and with reduced motion the same
 *  seven chapters flow naturally as stacked, still-legible exhibition panels. */
export default function ScrollPlay({ content }: { content?: RemoteContent | null }): React.JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const [active, setActive] = useState(0);
  const [staticMode, setStaticMode] = useState(false);
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const fr = lang === "fr";
  const chapters = t.play.chapters;
  const total = chapters.length;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = (): void => setStaticMode(query.matches);
    sync();
    query.addEventListener("change", sync);
    return (): void => query.removeEventListener("change", sync);
  }, []);

  const data = useMemo(() => {
    const skills = (content?.skills ?? SKILLS)
      .filter((skill) => museumSkillAllowed(skill))
      .map((skill) => ({ name: skill.name, logo: "logo" in skill ? skill.logo : undefined }));
    const projects = content
      ? content.projects
          .filter((project) => project.visible !== false)
          .map((project) => ({
            key: project.id,
            title: fr ? project.titleFr || project.title : project.title,
            image: project.id === "proj-budi-s" ? "/brand/budi-light.svg" : project.image || projectCoverFor(project.github) || "",
            tech: project.tech ?? [],
            category: project.category,
            state: getProjectAvailability(project).state as ProjectState,
          }))
      : t.projects.items.map((project, index) => ({
          key: `project-${index}`,
          title: project.title,
          image: projectCoverFor(project.github) || "",
          tech: project.tech,
          category: project.category,
          state: (project.status === "completed" ? "available" : "in-progress") as ProjectState,
        }));
    const rawServices: { title: string; titleFr?: string; category: string; tags: string[] }[] = content?.services ?? t.services.items;
    const services = rawServices
      .filter((service) => museumServiceAllowed({ title: service.title, titleFr: service.titleFr ?? service.title }))
      .map((service) => ({
        name: fr ? service.titleFr || service.title : service.title,
        category: service.category,
        tags: service.tags ?? [],
      }));
    const certs = (content?.certs ?? [])
      .filter((cert) => cert.visible !== false && !cert.id.startsWith("study-"))
      .map((cert) => ({
        key: cert.id,
        title: fr ? cert.titleFr || cert.titleEn : cert.titleEn,
        issuer: fr ? cert.issuerFr || cert.issuerEn : cert.issuerEn,
        image: cert.image,
      }));
    const studies = studyFrames.map((study) => ({
      key: study.key,
      title: fr ? study.fr : study.en,
      issuer: study.provider,
      image: study.image,
    }));
    return { skills, projects, services, certs, studies };
  }, [content, fr, t]);

  const counts = {
    skills: data.skills.length,
    projects: data.projects.length,
    services: data.services.length,
    certificates: data.certs.length,
    studies: data.studies.length,
  };
  const featured = data.projects[0];
  const archiveFrames = (data.certs.length ? data.certs : data.studies).slice(0, 3);
  const archiveIsStudy = data.certs.length === 0;
  const email = content?.settings?.contactEmail || profile.email;
  const whatsapp = "https://wa.me/201065228072";

  // Camera: scroll progress selects the chapter and drives each scene's depth.
  useEffect(() => {
    if (staticMode || reduced) return;
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>(".tour-stage");
    if (!root || !stage) return;
    let last = -1;
    const update = (): void => {
      frameRef.current = 0;
      const rect = root.getBoundingClientRect();
      const sticky = parseFloat(getComputedStyle(stage).top) || 0;
      const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
      const progress = Math.min(1, Math.max(0, (sticky - rect.top) / travel));
      const index = Math.min(total - 1, Math.floor(progress * total));
      const local = Math.min(1, Math.max(0, progress * total - index));
      root.style.setProperty("--tour-progress", progress.toFixed(4));
      root.style.setProperty("--tour-local", local.toFixed(4));
      if (trackRef.current) trackRef.current.style.transform = `scaleX(${progress})`;
      if (index !== last) {
        last = index;
        setActive(index);
      }
    };
    const onScroll = (): void => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return (): void => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reduced, staticMode, total]);

  // Compact/static mode: the chapter in view is the active one.
  useEffect(() => {
    if (!staticMode && !reduced) return;
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>(".tour-scene"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-18% 0px -30% 0px", threshold: 0.25 },
    );
    scenes.forEach((scene) => observer.observe(scene));
    return (): void => observer.disconnect();
  }, [reduced, staticMode]);

  const jump = (index: number): void => {
    const root = rootRef.current;
    if (!root) return;
    if (staticMode || reduced) {
      root.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      return;
    }
    const stage = root.querySelector<HTMLElement>(".tour-stage");
    if (!stage) return;
    const sticky = parseFloat(getComputedStyle(stage).top) || 0;
    const travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    const progress = Math.min(1, (index + 0.03) / total);
    const top = root.getBoundingClientRect().top + window.scrollY - sticky + progress * travel;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const goToCollection = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    const target = document.getElementById("services");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const renderScene = (id: ChapterId): React.JSX.Element => {
    if (id === "gate") return <GateArt />;
    if (id === "skills") return <SkillsArt skills={data.skills.slice(0, 5)} label={t.play.museum} />;
    if (id === "projects") return <ProjectsArt featured={featured} label={t.play.featuredLabel} fr={fr} />;
    if (id === "services") return <ServicesArt services={data.services.slice(0, 3)} fr={fr} />;
    if (id === "archive") return <ArchiveArt frames={archiveFrames} fr={fr} isStudy={archiveIsStudy} studyLabel={t.play.study} issuedLabel={t.play.issued} />;
    if (id === "corridor") return <CorridorArt email={email} whatsapp={whatsapp} emailLabel={t.play.emailLabel} whatsappLabel={t.play.whatsappLabel} fr={fr} />;
    return (
      <CollectionArt
        counts={counts}
        labels={t.play.counts}
        stats={{
          skills: countLabel(t.play.counts.skills, counts.skills),
          projects: countLabel(t.play.counts.projects, counts.projects),
          services: countLabel(t.play.counts.services, counts.services),
          certificates: counts.certificates ? countLabel(t.play.counts.certificates, counts.certificates) : countLabel(t.play.counts.certificates, counts.studies),
        }}
        fr={fr}
      />
    );
  };

  const chapterNumber = (index: number): string => `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <section
      id="scrollplay"
      ref={rootRef}
      aria-label={t.play.hint}
      className={`tour${staticMode || reduced ? " tour--static" : ""}`}
      style={{ "--tour-length": total, "--tour-height": `${100 + Math.max(0, total - 1) * 78}svh` } as React.CSSProperties}
    >
      <div className="tour-stage">
        <div className="tour-ambient" aria-hidden="true" />
        <header className="tour-top">
          <a className="tour-brand" href="#scrollplay" aria-label={`BUDI — ${t.play.museum}`}>
            <span className="tour-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 58 84"><path d={BUDI_MARK_PATH} fillRule="evenodd" /></svg>
            </span>
            <span className="tour-brand-word">BUDI</span>
            <span className="tour-brand-sub">/ {t.play.museum}</span>
          </a>
          <p className="tour-count" aria-live="polite">
            <strong>{String(active + 1).padStart(2, "0")}</strong>
            <i>/</i>
            <span>{String(total).padStart(2, "0")}</span>
          </p>
          <a className="tour-skip" href="#services" onClick={goToCollection}>
            {t.play.skip}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </header>

        <div className="tour-scenes">
          {chapters.map((chapter, index) => {
            const id = chapter.id as ChapterId;
            const Icon = hallIcons[id] ?? Sparkles;
            const isActive = staticMode || reduced || index === active;
            const before = !staticMode && !reduced && index < active;
            const after = !staticMode && !reduced && index > active;
            return (
              <article
                key={chapter.id}
                id={`tour-${chapter.id}`}
                data-index={index}
                aria-labelledby={`tour-title-${chapter.id}`}
                className={`tour-scene tour-scene--${chapter.id}${isActive ? " is-active" : ""}${before ? " is-before" : ""}${after ? " is-after" : ""}`}
              >
                <div className="tour-art">{renderScene(id)}</div>
                <span className="tour-scrim" aria-hidden="true" />
                <div className="tour-copy">
                  <p className="tour-kicker">
                    <Icon size={15} aria-hidden="true" />
                    {chapter.kicker}
                  </p>
                  <h2 id={`tour-title-${chapter.id}`}>
                    <span>{chapter.a}</span>
                    <em>{chapter.b}</em>
                  </h2>
                  <p className="tour-body">{chapter.body}</p>
                  <div className="tour-actions">
                    <a
                      className="tour-cta"
                      href={id === "collection" ? "#services" : id === "corridor" ? "#contact" : `#${id === "gate" ? "skills" : id === "archive" ? "certificates" : id}`}
                      onClick={id === "collection" ? goToCollection : undefined}
                    >
                      {chapter.cta}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                    <span className="tour-scene-number" aria-hidden="true">{chapterNumber(index)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <nav className="tour-rail" aria-label={t.play.navLabel}>
          <ol>
            {chapters.map((chapter, index) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => jump(index)}
                  aria-label={`${t.play.chapterWord} ${index + 1}: ${chapter.nav}`}
                  aria-current={index === active ? "step" : undefined}
                  className={index === active ? "is-current" : undefined}
                >
                  <span className="tour-rail-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="tour-rail-label">{chapter.nav}</span>
                  <span className="tour-rail-dot" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <footer className="tour-bottom">
          <span className="tour-hint"><ArrowDown size={14} aria-hidden="true" /> {t.play.scrollHint}</span>
          <span className="tour-track" aria-hidden="true"><span ref={trackRef} /></span>
          <span className="tour-percent">{Math.round(((active + 1) / total) * 100)}%</span>
        </footer>
      </div>
    </section>
  );
}

/* ————————————————————————— Scenes ————————————————————————— */

function GateArt(): React.JSX.Element {
  return (
    <div className="scene scene-gate">
      <span className="gate-sky" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="gate-horizon" aria-hidden="true" />
      <div className="gate-facade" aria-hidden="true">
        <span className="gate-wing gate-wing--left"><i /><i /><i /><i /><i /><i /></span>
        <div className="gate-portal">
          <span className="gate-light" />
          <span className="gate-door gate-door--left"><i /><i /><i /></span>
          <span className="gate-door gate-door--right"><i /><i /><i /></span>
          <span className="gate-emblem">
            <svg viewBox="0 0 58 84"><path d={BUDI_MARK_PATH} fillRule="evenodd" /></svg>
            <b>BUDI</b>
          </span>
        </div>
        <span className="gate-wing gate-wing--right"><i /><i /><i /><i /><i /><i /></span>
        <span className="gate-lintel" />
      </div>
      <span className="gate-floor" aria-hidden="true" />
      <span className="gate-dust" aria-hidden="true" />
    </div>
  );
}

function SkillsArt({ skills, label }: { skills: { name: string; logo?: string }[]; label: string }): React.JSX.Element {
  return (
    <div className="scene scene-skills">
      <div className="vault" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="vault-label" aria-hidden="true"><span>{label}</span><i /></div>
      <div className="artifact-row" style={{ "--count": Math.max(1, skills.length) } as React.CSSProperties}>
        {skills.map((skill, index) => {
          const Icon = artifactIcons[index % artifactIcons.length];
          return (
            <div className="artifact" key={skill.name}>
              <span className="artifact-spot" aria-hidden="true" />
              <span className="artifact-body" aria-hidden="true">
                <Icon className="artifact-sculpture" strokeWidth={1.1} />
                <span className="artifact-seal"><TechnologyIcon name={skill.name} src={skill.logo} /></span>
              </span>
              <span className={`artifact-plinth artifact-plinth--${index % 4}`} aria-hidden="true" />
              <span className="artifact-name"><small>{String(index + 1).padStart(2, "0")}</small>{skill.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsArt({ featured, label, fr }: { featured?: { title: string; image: string; tech: string[]; category: string; state: ProjectState }; label: string; fr: boolean }): React.JSX.Element {
  if (!featured) return <div className="scene scene-projects" />;
  return (
    <div className="scene scene-projects">
      <div className="great-hall" aria-hidden="true"><span /><span /><span /></div>
      <div className="side-vitrine side-vitrine--left" aria-hidden="true"><i /><b>{featured.tech[0] ?? "BUDI"}</b></div>
      <div className="featured-work">
        <span className="featured-beam" aria-hidden="true" />
        <div className="featured-frame">
          {featured.image ? <img src={featured.image} alt="" loading="lazy" /> : <span className="featured-empty" aria-hidden="true">BUDI</span>}
          <span className="featured-glass" aria-hidden="true" />
        </div>
        <span className="featured-pedestal" aria-hidden="true" />
        <p className="featured-caption">
          <small>{label}</small>
          <strong>{featured.title}</strong>
          <span>{featured.category} · {statusLabel(featured.state, fr)}</span>
        </p>
      </div>
      <div className="side-vitrine side-vitrine--right" aria-hidden="true"><i /><b>{featured.tech[1] ?? "STACK"}</b></div>
      <div className="project-badges" aria-hidden="true">
        {featured.tech.slice(0, 4).map((tech) => <span key={tech}>{tech}</span>)}
      </div>
    </div>
  );
}

function ServicesArt({ services, fr }: { services: { name: string; category: string; tags: string[] }[]; fr: boolean }): React.JSX.Element {
  return (
    <div className="scene scene-services">
      <div className="creation-rings" aria-hidden="true"><span /><span /><span /></div>
      <div className="capsule-row" style={{ "--count": Math.max(1, services.length) } as React.CSSProperties}>
        {services.map((service, index) => {
          const Icon = serviceIcon(service.name, service.category);
          return (
            <div className="capsule" key={service.name}>
              <span className="capsule-halo" aria-hidden="true" />
              <span className="capsule-glass" aria-hidden="true">
                <Icon strokeWidth={1.2} />
                <i /><i /><i />
              </span>
              <span className="capsule-base" aria-hidden="true" />
              <span className="capsule-name"><small>{fr ? "Invention" : "Invention"} {String(index + 1).padStart(2, "0")}</small>{service.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArchiveArt({ frames, fr, isStudy, studyLabel, issuedLabel }: { frames: { key: string; title: string; issuer: string; image: string }[]; fr: boolean; isStudy: boolean; studyLabel: string; issuedLabel: string }): React.JSX.Element {
  return (
    <div className="scene scene-archive">
      <div className="archive-wall" aria-hidden="true"><span /><span /><span /></div>
      <div className="archive-rail" aria-hidden="true" />
      <div className="frame-row" style={{ "--count": Math.max(1, frames.length) } as React.CSSProperties}>
        {frames.map((frame, index) => (
          <figure className="archive-frame" key={frame.key}>
            <span className="archive-spot" aria-hidden="true" />
            <span className="archive-mount" aria-hidden="true">
              {frame.image ? <img src={frame.image} alt="" loading="lazy" /> : <Award />}
              <span className="archive-glass" />
            </span>
            <span className="archive-plaque">
              <small>{String(index + 1).padStart(2, "0")} · {isStudy ? studyLabel : issuedLabel}</small>
              <strong>{frame.title}</strong>
              <em>{frame.issuer}</em>
            </span>
          </figure>
        ))}
      </div>
      <p className="archive-note" aria-hidden="true">{fr ? "AUC · MICROSOFT LEARN · CISCO" : "AUC · MICROSOFT LEARN · CISCO"}</p>
    </div>
  );
}

function CorridorArt({ email, whatsapp, emailLabel, whatsappLabel, fr }: { email: string; whatsapp: string; emailLabel: string; whatsappLabel: string; fr: boolean }): React.JSX.Element {
  return (
    <div className="scene scene-corridor">
      <div className="corridor" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <span className="corridor-floor" aria-hidden="true" />
      <div className="corridor-exit" aria-hidden="true"><span /></div>
      <div className="corridor-plaques">
        <a className="corridor-plaque corridor-plaque--email" href={`mailto:${email}`}>
          <span className="corridor-plaque-icon" aria-hidden="true"><Mail size={19} /></span>
          <span><small>{emailLabel}</small><strong>{email}</strong></span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <a className="corridor-plaque corridor-plaque--whatsapp" href={whatsapp} target="_blank" rel="noreferrer">
          <span className="corridor-plaque-icon" aria-hidden="true"><MessageCircle size={19} /></span>
          <span><small>{whatsappLabel}</small><strong>{fr ? "Discuter maintenant" : "Chat now"}</strong></span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function CollectionArt({
  counts,
  labels,
  stats,
  fr,
}: {
  counts: { skills: number; projects: number; services: number; certificates: number; studies: number };
  labels: { skills: [string, string]; projects: [string, string]; services: [string, string]; certificates: [string, string] };
  stats: { skills: string; projects: string; services: string; certificates: string };
  fr: boolean;
}): React.JSX.Element {
  const rows = [
    { href: "#services", index: "01", label: labels.services, count: counts.services, icon: BriefcaseBusiness },
    { href: "#projects", index: "02", label: labels.projects, count: counts.projects, icon: Layers3 },
    { href: "#skills", index: "03", label: labels.skills, count: counts.skills, icon: Code2 },
    { href: "#certificates", index: "04", label: labels.certificates, count: counts.certificates || counts.studies, icon: Award },
  ];
  return (
    <div className="scene scene-collection">
      <div className="collection-gate" aria-hidden="true"><span /><span /></div>
      <div className="collection-glow" aria-hidden="true" />
      <div className="collection-list">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <a href={row.href} key={row.href} className="collection-row">
              <span className="collection-icon" aria-hidden="true"><Icon size={18} /></span>
              <span className="collection-name">
                <small>{row.index}</small>
                <strong>{row.label[1]}</strong>
                <em>{fr ? "Salle" : "Hall"} {row.index}</em>
              </span>
              <span className="collection-count">
                <b>{String(row.count).padStart(2, "0")}</b>
                <small>{countLabel(row.label, row.count)}</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          );
        })}
      </div>
      <p className="collection-foot" aria-hidden="true">{stats.services} · {stats.projects} · {stats.skills} · {stats.certificates}</p>
    </div>
  );
}
