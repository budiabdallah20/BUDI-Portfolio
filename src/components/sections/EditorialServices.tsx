"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Activity, ArrowUpRight, Check, ExternalLink, Layers, Sparkles, Workflow } from "lucide-react";
import gsap from "gsap";
import TechnologyIcon from "@/components/TechnologyIcon";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { HomeVisibility } from "@/config/home-visibility";
import { atelierServices, atelierSkillRoles } from "@/data/atelier-services";
import { editorialSkills } from "@/data/editorial-skills";
import { profile } from "@/data/portfolio";
import { projectAnchor, projectSlug, showcaseProjects } from "@/data/showcase-projects";
import { studioServiceContactAnchor, studioServiceMatches, studioServices, type StudioService } from "@/data/studio-services";
import type { Lang } from "@/i18n/dictionaries";
import type { RemoteContent } from "@/lib/content";
import { skillMatchesTech } from "@/lib/skill-usage";
import ServiceDossierWindow, { dossierId, dossierTitleId } from "./ServiceDossierWindow";
import styles from "./editorial-services.module.css";

const motionQuery = "(prefers-reduced-motion: no-preference)";
const pointerQuery = "(hover: hover) and (pointer: fine) and " + motionQuery;
const serviceMotifs = { build: Layers, system: Workflow, care: Activity };

const labels = {
  en: {
    eyebrow: "03 / Services",
    title: ["The Craft Behind", "the Code"],
    dossier: "Service Dossier",
    explore: "Explore Service",
    related: "View Related Work",
    close: "Close service dossier",
    deliver: "Core Deliverables",
    process: "Execution Methodology",
    tech: "Technologies & Roles",
    evidence: "Verified Project Evidence",
    why: "Engineering Standards & Trust",
    start: "Start a Conversation",
    caseStudy: "Read Project Case Study",
    switchLabel: "Explore Alternative Services",
    role: "Contribution",
    evidenceBadge: "Proven in",
  },
  fr: {
    eyebrow: "03 / Services",
    title: ["Le Savoir-Faire", "Derrière le Code"],
    dossier: "Dossier de Service",
    explore: "Explorer le Service",
    related: "Voir le Projet Associé",
    close: "Fermer le dossier",
    deliver: "Livrables Principaux",
    process: "Méthode d'Exécution",
    tech: "Technologies & Rôles",
    evidence: "Réalisations Vérifiées",
    why: "Standards d'Ingénierie & Confiance",
    start: "Initier un Projet",
    caseStudy: "Lire l'Étude de Cas",
    switchLabel: "Explorer d'Autres Services",
    role: "Contribution",
    evidenceBadge: "Éprouvé dans",
  },
} as const;

function resolveServices(content: RemoteContent | null, lang: Lang) {
  const projects = showcaseProjects(content, lang);
  const skills = editorialSkills(content, lang);

  return studioServices.map((service) => {
    const record = content?.services.find(
      (row) =>
        row.visible !== false &&
        [row.title, row.titleFr].some((title) => title && studioServiceMatches(service.key, title))
    );
    return {
      service,
      project: projects.find((project) => projectSlug(project) === service.projectId),
      skills: skills.filter(
        (skill) =>
          service.skillIds.some((id) => id === skill.technology) ||
          record?.tags.some((tag) => skillMatchesTech(skill.name, tag))
      ),
    };
  });
}

type ServiceView = ReturnType<typeof resolveServices>[number];
type Project = NonNullable<ServiceView["project"]>;

function caseStudyHref(project: Project, lang: Lang) {
  return "/" + lang + "/projects/" + encodeURIComponent(projectSlug(project));
}

function lightAndTiltCard(card: HTMLElement, clientX: number, clientY: number) {
  const { left, top, width, height } = card.getBoundingClientRect();
  const x = gsap.utils.clamp(0, 1, (clientX - left) / width);
  const y = gsap.utils.clamp(0, 1, (clientY - top) / height);
  card.style.setProperty("--light-x", x * 100 + "%");
  card.style.setProperty("--light-y", y * 100 + "%");
  card.style.setProperty("--tilt-x", (y - 0.5) * -7 + "deg");
  card.style.setProperty("--tilt-y", (x - 0.5) * 7 + "deg");
}

function CornerBrackets({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 0 14 L 0 0 L 14 0" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 86 0 L 100 0 L 100 14" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 0 86 L 0 100 L 14 100" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M 86 100 L 100 100 L 100 86" stroke="var(--budi-gold-400)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function useServicesEntrance(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = root.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const media = gsap.matchMedia(section);
    media.add(motionQuery, () => {
      let entrance: gsap.core.Timeline | undefined;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          entrance = gsap
            .timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
            .from(section.querySelectorAll("[data-service-intro]"), {
              y: 22,
              opacity: 0,
              stagger: 0.08,
              duration: 0.65,
            })
            .from(
              section.querySelectorAll("[data-service-card]"),
              { y: 32, opacity: 0, stagger: 0.12, duration: 0.75, ease: "back.out(1.15)" },
              0.16
            );
        },
        { rootMargin: "0px 0px -8% 0px" }
      );
      observer.observe(section);
      return () => {
        observer.disconnect();
        entrance?.revert();
      };
    });
    return () => media.revert();
  }, [root]);
}

function ServiceCard({
  item,
  lang,
  selected,
  projectHref,
  onExplore,
}: {
  item: ServiceView;
  lang: Lang;
  selected: boolean;
  projectHref?: string;
  onExplore: (button: HTMLButtonElement) => void;
}) {
  const { service, skills, project } = item;
  const copy = service[lang];
  const process = atelierServices[service.key][lang].process;
  const words = labels[lang];
  const headingId = "service-" + service.key;
  const Motif = serviceMotifs[service.key];
  const pending = useRef(0);

  useEffect(() => () => cancelAnimationFrame(pending.current), []);

  function move(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || !matchMedia(pointerQuery).matches) return;
    const { currentTarget, clientX, clientY } = event;
    cancelAnimationFrame(pending.current);
    pending.current = requestAnimationFrame(() => lightAndTiltCard(currentTarget, clientX, clientY));
  }

  function reset(event: PointerEvent<HTMLElement>) {
    cancelAnimationFrame(pending.current);
    for (const property of ["--light-x", "--light-y", "--tilt-x", "--tilt-y"]) {
      event.currentTarget.style.removeProperty(property);
    }
  }

  return (
    <article
      id={headingId}
      aria-labelledby={headingId + "-title"}
      className={styles.card}
      data-service-card={service.key}
      data-selected={selected}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <CornerBrackets className={styles.brackets} />

      {/* Identity row with large index and category micro-label */}
      <div className={styles.identity}>
        <span className={styles.index}>{service.shot}</span>
        <span className={styles.category}>{copy.label}</span>
        <Motif className={styles.motif} size={24} strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Summary with high-contrast typography */}
      <div className={styles.summary}>
        <h3 id={headingId + "-title"}>{copy.name}</h3>
        <p className={styles.valueStatement}>{copy.value}</p>
      </div>

      {/* Three clear deliverables */}
      <ul className={styles.deliverables} role="list">
        {copy.points.map((point) => (
          <li key={point}>
            <Check size={14} className={styles.checkIcon} aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* Working process and skills preview */}
      <div className={styles.preview}>
        <div className={styles.processRailRow}>
          <ol className={styles.steps} aria-label={words.process} role="list">
            {process.map(([step]) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        {skills.length > 0 && (
          <ul className={styles.pills} aria-label={words.tech} role="list">
            {skills.slice(0, 3).map((skill) => (
              <li key={skill.anchor}>{skill.name}</li>
            ))}
          </ul>
        )}

        {/* Verified project proof chip directly on the card surface */}
        {project && (
          <div className={styles.cardEvidence}>
            <span className={styles.evidenceKicker}>
              <Sparkles size={11} aria-hidden="true" />
              {words.evidenceBadge}
            </span>
            <span className={styles.evidenceTitle}>{project.title}</span>
          </div>
        )}
      </div>

      {/* Premium Chamfered Action Row */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          id={"explore-" + service.key}
          aria-controls={selected ? dossierId : undefined}
          aria-haspopup="dialog"
          aria-label={words.explore + " — " + copy.name}
          onClick={(event) => onExplore(event.currentTarget)}
        >
          <span>{words.explore}</span>
          <ArrowUpRight size={15} aria-hidden="true" className={styles.btnArrow} />
        </button>

        {projectHref && (
          <a
            className={styles.secondary}
            href={projectHref}
            aria-label={words.related + " — " + item.project?.title}
          >
            <span>{words.related}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

function ServiceDetails({
  item,
  lang,
  visibility,
  email,
  projectHref,
  onSelect,
}: {
  item: ServiceView;
  lang: Lang;
  visibility: HomeVisibility;
  email: string;
  projectHref?: string;
  onSelect: (key: StudioService["key"]) => void;
}) {
  const { service, project, skills } = item;
  const copy = service[lang];
  const detail = atelierServices[service.key][lang];
  const words = labels[lang];
  const contactHref = visibility.contact
    ? "#" + studioServiceContactAnchor(service.key)
    : "mailto:" + email + "?subject=" + encodeURIComponent(copy.name);

  return (
    <div className={styles.detail} data-service-detail={service.key}>
      <header className={styles.detailHeader}>
        <div>
          <p className={styles.eyebrow}>
            {service.shot} / {copy.label}
          </p>
          <h3 id={dossierTitleId} tabIndex={-1}>
            {copy.name}
          </h3>
          <p className={styles.detailDesc}>{copy.description}</p>
        </div>
      </header>

      <div key={service.key} className={styles.detailGrid}>
        {/* Core Deliverables */}
        <div className={styles.detailCard}>
          <div className={styles.detailSectionHeader}>
            <span className={styles.sectionIndex}>01</span>
            <h4>{words.deliver}</h4>
          </div>
          <ul className={styles.scope} role="list">
            {copy.points.map((point) => (
              <li key={point}>
                <Check size={16} className={styles.scopeCheck} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Execution Methodology */}
        <div className={styles.detailCard}>
          <div className={styles.detailSectionHeader}>
            <span className={styles.sectionIndex}>02</span>
            <h4>{words.process}</h4>
          </div>
          <ol className={styles.timeline} role="list">
            {detail.process.map(([step, description]) => (
              <li key={step}>
                <div className={styles.timelineStepHeader}>
                  <strong className={styles.timelineStepName}>{step}</strong>
                </div>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Technologies & Roles */}
        {skills.length > 0 && (
          <div className={styles.detailCard}>
            <div className={styles.detailSectionHeader}>
              <span className={styles.sectionIndex}>03</span>
              <h4>{words.tech}</h4>
            </div>
            <ul className={styles.skillList} role="list">
              {skills.map((skill) => {
                const name = visibility.skills ? (
                  <a href={"#" + skill.anchor} className={styles.skillAnchorLink}>
                    <span>{skill.name}</span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ) : (
                  <strong>{skill.name}</strong>
                );
                return (
                  <li key={skill.anchor} className={styles.skillItem}>
                    <span className={styles.skillIcon}>
                      <TechnologyIcon name={skill.name} src={skill.logo} />
                    </span>
                    <div className={styles.skillInfo}>
                      {name}
                      {atelierSkillRoles[skill.technology] && (
                        <p>{atelierSkillRoles[skill.technology][lang]}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Verified Project Evidence */}
        <div className={styles.detailCard}>
          <div className={styles.detailSectionHeader}>
            <span className={styles.sectionIndex}>04</span>
            <h4>{words.evidence}</h4>
          </div>
          {project ? (
            <div className={styles.proof}>
              <div className={styles.proofHeader}>
                <span className={styles.proofType}>{detail.projectType || project.category}</span>
                <strong className={styles.proofTitle}>{project.title}</strong>
              </div>
              <p className={styles.proofRole}>
                <b>{words.role}</b> ·{" "}
                {service.key === "care" ? detail.projectRole : project.role || detail.projectRole}
              </p>
              <p className={styles.proofBody}>
                {detail.evidence ?? (project.points?.[0] || project.summary)}
              </p>
              <ul className={styles.proofStack} aria-label={words.tech} role="list">
                {Array.from(new Set(project.tech)).map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
              <a className={styles.textLink} href={caseStudyHref(project, lang)}>
                <span>{words.caseStudy}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          ) : (
            <p className={styles.proofFallback}>{detail.fallback}</p>
          )}
        </div>

        {/* Engineering Standards and Trust */}
        <div className={`${styles.detailCard} ${styles.trust}`} data-dossier-reveal>
          <div className={styles.detailSectionHeader}>
            <span className={styles.sectionIndex}>05</span>
            <h4>{words.why}</h4>
          </div>
          <ul role="list">
            {detail.strength.map((point) => (
              <li key={point}>
                <Check size={15} className={styles.trustCheck} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Zone & Contextual CTA */}
      <footer className={styles.actionZone} data-dossier-reveal>
        <div className={styles.actionZoneHeader}>
          <h4>{words.start}</h4>
          <p className={styles.actionZoneSub}>
            {lang === "fr"
              ? "Parlons des exigences techniques et des objectifs de votre projet."
              : "Let's discuss the technical requirements and execution path for your project."}
          </p>
        </div>

        <div className={styles.actions}>
          <a className={styles.primary} href={contactHref}>
            <span>{copy.action}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          {projectHref && (
            <a className={styles.secondary} href={projectHref}>
              <span>{words.related}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Seamless Service Switcher */}
        <div className={styles.switches}>
          <p className={styles.switchesLabel}>{words.switchLabel}</p>
          <div role="group" aria-label={words.switchLabel} className={styles.switchButtons}>
            {studioServices
              .filter((other) => other.key !== service.key)
              .map((other) => (
                <button
                  className={styles.ghost}
                  type="button"
                  key={other.key}
                  onClick={() => onSelect(other.key)}
                >
                  <span>{other[lang].label}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function EditorialServices({
  content,
  visibility,
  email = profile.email,
  legacy = false,
}: {
  content: RemoteContent | null;
  visibility: HomeVisibility;
  email?: string;
  legacy?: boolean;
}) {
  const { lang } = useLanguage();
  const words = labels[lang];
  const root = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState<{ key: StudioService["key"]; opener: HTMLButtonElement }>();
  const entries = useMemo(() => resolveServices(content, lang), [content, lang]);
  const active = entries.find((item) => item.service.key === selection?.key);

  useServicesEntrance(root);

  function relatedWork(project: ServiceView["project"]) {
    if (!project) return undefined;
    return visibility.projects && !legacy ? "#" + projectAnchor(project.key) : caseStudyHref(project, lang);
  }

  return (
    <section id="services" className={styles.atelier} aria-labelledby="services-heading" ref={root}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow} data-service-intro>
              {words.eyebrow}
            </p>
            <h2 id="services-heading" data-service-intro className={styles.sectionHeading}>
              <span>{words.title[0]}</span> <em>{words.title[1]}</em>
            </h2>
          </div>
        </header>

        {/* Distinctive Services Metrics & Telemetry Counter */}
        <div className={styles.metricsBand} data-service-intro>
          <div className={styles.metricItem}>
            <span className={styles.metricNum}>03</span>
            <div className={styles.metricText}>
              <strong className={styles.metricTitle}>
                {lang === "fr" ? "Domaines d'Ingénierie" : "Engineering Disciplines"}
              </strong>
              <span className={styles.metricDesc}>
                {lang === "fr" ? "Applications · Systèmes · Maintenance" : "Web Apps · Systems · Optimization"}
              </span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricNum}>100%</span>
            <div className={styles.metricText}>
              <strong className={styles.metricTitle}>
                {lang === "fr" ? "Architecture Type-Safe" : "Type-Safe Delivery"}
              </strong>
              <span className={styles.metricDesc}>
                {lang === "fr" ? "Zéro compromis, TypeScript strict" : "Zero shortcuts, strict typing"}
              </span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricNum}>OWASP</span>
            <div className={styles.metricText}>
              <strong className={styles.metricTitle}>
                {lang === "fr" ? "Sécurité par Défaut" : "Secure by Architecture"}
              </strong>
              <span className={styles.metricDesc}>
                {lang === "fr" ? "Résilience & audit continu" : "Security habits & resilience"}
              </span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <div className={styles.metricPulseWrapper}>
              <span className={styles.metricLiveDot} aria-hidden="true" />
              <span className={styles.metricLivePing} aria-hidden="true" />
            </div>
            <div className={styles.metricText}>
              <strong className={styles.metricTitle}>
                {lang === "fr" ? "Disponibilité & SLA" : "High Availability SLA"}
              </strong>
              <span className={styles.metricDesc}>
                {lang === "fr" ? "Performance continue <100ms" : "Under 100ms target latency"}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Luminous Inter-Card Energy Chain */}
        <div className={styles.cardsWrapper}>
          <div className={styles.cardsConnectingRail} aria-hidden="true">
            <span className={styles.railTrack} />
            <span className={styles.railEnergyPulse} />
            <div className={styles.railNode} data-node="1">
              <span className={styles.nodeCore} />
              <span className={styles.nodePing} />
              <span className={styles.nodeText}>01 · BUILD</span>
            </div>
            <div className={styles.railNode} data-node="2">
              <span className={styles.nodeCore} />
              <span className={styles.nodePing} />
              <span className={styles.nodeText}>02 · SYSTEM</span>
            </div>
            <div className={styles.railNode} data-node="3">
              <span className={styles.nodeCore} />
              <span className={styles.nodePing} />
              <span className={styles.nodeText}>03 · CARE</span>
            </div>
          </div>

          <div className={styles.grid}>
            {entries.map((item) => (
              <ServiceCard
                key={item.service.key}
                item={item}
                lang={lang}
                selected={selection?.key === item.service.key}
                projectHref={relatedWork(item.project)}
                onExplore={(opener) => setSelection({ key: item.service.key, opener })}
              />
            ))}
          </div>
        </div>

        {active && selection && (
          <ServiceDossierWindow
            serviceKey={active.service.key}
            caption={words.dossier}
            closeLabel={words.close}
            opener={selection.opener}
            onDismiss={() => setSelection(undefined)}
          >
            <ServiceDetails
              key={active.service.key}
              item={active}
              lang={lang}
              visibility={visibility}
              email={email}
              projectHref={relatedWork(active.project)}
              onSelect={(key) => setSelection({ ...selection, key })}
            />
          </ServiceDossierWindow>
        )}
      </div>
    </section>
  );
}
