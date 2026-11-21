"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, GitFork, Layers3, Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountUp from "@/components/CountUp";
import { techLogo } from "@/data/techLogos";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { selectTechnology } from "@/lib/project-filter";
import { skillMatchesTech } from "@/lib/skill-usage";
import { isRaqibProject } from "@/lib/studio-projects";
import { spotlight, useStudioReveal } from "./studio-reveal";
import ProjectLike from "./ProjectLike";
import Magnetic from "./Magnetic";
import "./phase-one.css";
import "./cinematic.css";

type Project = {
  key: string;
  name: string;
  image?: string;
  gallery?: string[];
  category?: string;
  description?: string;
  points?: string[];
  tags?: string[];
  demo?: string;
  github?: string;
  status?: string;
  deadline?: string;
  likes?: number;
};

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("budi:technology", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("budi:technology", callback);
  };
}
const technologySnapshot = (): string => new URLSearchParams(window.location.search).get("technology") ?? "";
const serverTechnology = (): string => "";
const imageFile = /\.(avif|webp|png|jpe?g)(?:\?|$)/i;
const external = (url?: string): string | undefined => url && /^https?:\/\//i.test(url) ? url : undefined;
const position = (index: number): string => String(index + 1).padStart(2, "0");

function previewFor(item: Project): string | undefined {
  return isRaqibProject(item)
    ? "/images/projects/studio-raqib.webp"
    : item.gallery?.find((src) => imageFile.test(src)) || item.image;
}

export default function ProjectVitrines<T extends Project>({ items, onOpen, labels }: {
  items: T[];
  onOpen: (item: T) => void;
  labels: { available: string; maintenance: string; progress: string; due: string; image: string };
}) {
  const { lang } = useLanguage();
  const fr = lang === "fr";
  const technology = useSyncExternalStore(subscribe, technologySnapshot, serverTechnology);
  const root = useStudioReveal(technology);
  const deckRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = technology ? items.filter((item) => item.tags?.some((tag) => skillMatchesTech(technology, tag))) : items;

  // Underlying cards recede as the next card climbs over them: real sticky
  // depth, scrubbed by ScrollTrigger instead of a CSS-only fake stack.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const cards = Array.from(deck.querySelectorAll<HTMLElement>(".cine-stack-card"));
    const context = gsap.context(() => {
      cards.forEach((card, index) => {
        const next = cards[index + 1];
        if (!next) return;
        gsap.fromTo(card,
          { scale: 1, opacity: 1, filter: "blur(0px)", y: 0 },
          {
            scale: 0.94, opacity: 0.55, filter: "blur(3px)", y: -14, ease: "none",
            scrollTrigger: { trigger: next, start: "top 92%", end: "top 46%", scrub: 0.5 },
          },
        );
      });
    }, deck);
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, [visible.length, reduced]);

  const statusLabel = (status?: string): string =>
    status === "available" ? labels.available : status === "maintenance" ? labels.maintenance : labels.progress;

  return (
    <section id="projects" ref={root} className="budi-phase-one cine-section cine-section--projects" aria-labelledby="projects-heading">
      <div className="p1-inner">
        <header className="p1-heading cine-heading" data-p1-reveal>
          <div>
            <span className="cine-pill">{fr ? "01 · Portfolio" : "01 · Selected work"}</span>
            <h2 id="projects-heading" className="cine-gradient-title">
              {fr ? <>Le travail,<br /><em>en pratique.</em></> : <>The work,<br /><em>in practice.</em></>}
            </h2>
          </div>
          <div className="cine-heading-aside">
            <p>{fr ? "Des plateformes et applications à explorer, avec les choix techniques qui leur donnent forme." : "Explore the platforms and apps I’ve built, and the technical decisions behind them."}
              <ArrowDownRight size={22} aria-hidden="true" /></p>
            <span className="cine-counter" role="status">
              <CountUp end={items.length} />
              <strong>{fr ? "Systèmes phares" : "Flagship systems"}</strong>
            </span>
          </div>
        </header>

        {technology && (
          <div className="p1-filter">
            <p>{fr ? "Technologie" : "Technology"} · <b>{technology}</b></p>
            <button type="button" onClick={() => selectTechnology("")}>{fr ? "Voir tous les projets" : "Show all projects"}</button>
          </div>
        )}
        {visible.length === 0 && <p className="p1-empty">{fr ? "Aucun projet à afficher." : "No projects to show."}</p>}

        <div className="cine-deck" ref={deckRef}>
          {visible.map((item, index) => {
            const raqib = isRaqibProject(item);
            const preview = previewFor(item);
            return (
              <article key={item.key} id={`project-${item.key}`} className="cine-stack-card"
                style={{ "--stack-index": index, zIndex: index + 2 } as CSSProperties}>
                <span className="cine-chain-node" aria-hidden="true">{position(index)}</span>
                <div className="cine-card-grid">
                  <button type="button" className="cine-media" data-p1-shot
                    aria-haspopup="dialog" aria-label={`${fr ? "Ouvrir le projet" : "Open project"} · ${item.name}`}
                    onClick={() => onOpen(item)} onPointerMove={spotlight}
                    data-screenshot={imageFile.test(preview ?? "")}>
                    <span className="cine-media-aura" aria-hidden="true" />
                    <span className="cine-media-top">
                      {raqib && <img className="cine-raqib-badge" src="/images/projects/raqib-official-mark.svg" alt="" width={26} height={28} />}
                      <span className="cine-status-badge"><i aria-hidden="true" />{statusLabel(item.status)}</span>
                      <ArrowUpRight size={16} className="cine-media-arrow" aria-hidden="true" />
                    </span>
                    <span className="cine-media-frame">
                      {preview && <img src={preview} alt="" loading="lazy" decoding="async" width={960} height={600}
                        onError={(event) => { event.currentTarget.hidden = true; }} />}
                      {raqib && <img className="cine-raqib-wordmark" src="/images/projects/raqib-official-wordmark.svg" alt="Raqib" loading="lazy" />}
                      <span className="cine-preview-empty"><Layers3 size={28} aria-hidden="true" />{labels.image}</span>
                    </span>
                    <span className="cine-media-sheen" aria-hidden="true" />
                  </button>

                  <div className="cine-details" onPointerMove={spotlight}>
                    <span className="cine-details-spotlight" aria-hidden="true" />
                    <div className="cine-details-inner">
                      <div className="cine-details-title">
                        <p className="cine-index">{position(index)} <span>/ {item.category ?? (fr ? "Système" : "System")}</span></p>
                        <h3 className="cine-project-title">{item.name}</h3>
                        {item.deadline && item.status !== "available" && (
                          <p className="cine-due">{labels.due} · <time dateTime={item.deadline}>{item.deadline}</time></p>
                        )}
                      </div>

                      <div className="cine-subbox cine-subbox--brief">
                        <p className="cine-subbox-label"><Sparkles size={13} aria-hidden="true" />{fr ? "Nébuleuse du projet" : "Project brief"}</p>
                        {item.description && <p className="cine-subbox-copy">{item.description}</p>}
                        {!!item.points?.length && (
                          <ul className="cine-highlights">{item.points.slice(0, 3).map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}</ul>
                        )}
                      </div>

                      {!!item.tags?.length && (
                        <div className="cine-subbox cine-subbox--tech">
                          <p className="cine-subbox-label">{fr ? "Technologies utilisées" : "Tech stack"}</p>
                          <ul className="cine-tech-badges">
                            {Array.from(new Set(item.tags)).map((tag) => (
                              <li key={tag}>{techLogo(tag) && <img src={techLogo(tag)!} alt="" width={14} height={14} loading="lazy" />}{tag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="cine-actionbar">
                        <Magnetic className="cine-btn cine-btn--primary" onClick={() => onOpen(item)}>
                          {fr ? "Étude de cas" : "Case study"}<ArrowUpRight size={16} aria-hidden="true" />
                        </Magnetic>
                        {external(item.demo) && (
                          <Magnetic className="cine-btn cine-btn--live" href={external(item.demo)} ariaLabel={`${fr ? "Démo en direct" : "Live demo"} · ${item.name}`}>
                            {fr ? "Démo live" : "Live demo"}<ArrowUpRight size={15} aria-hidden="true" />
                          </Magnetic>
                        )}
                        {external(item.github) && (
                          <Magnetic className="cine-btn cine-btn--ghost" href={external(item.github)} ariaLabel={`${fr ? "Dépôt GitHub" : "GitHub repository"} · ${item.name}`}>
                            <GitFork size={15} aria-hidden="true" />{fr ? "Dépôt" : "Repo"}
                          </Magnetic>
                        )}
                        <ProjectLike id={item.key} base={item.likes ?? 0} lang={lang} />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <a className="p1-close cine-close" href="#contact">
          {fr ? "Parlons de votre projet" : "Let’s talk about your project"}<ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
