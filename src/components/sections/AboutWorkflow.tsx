"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Compass, PencilRuler, Code2, CheckCheck } from "lucide-react";
import styles from "./about-editorial.module.css";

const icons = [Compass, PencilRuler, Code2, CheckCheck] as const;

const phases = {
  en: [
    ["Discover", "Understand the problem, audience, constraints, and objectives."],
    ["Design", "Define structure, workflows, the component system, and the user experience."],
    ["Engineer", "Build the frontend, connect the backend, and validate application behavior."],
    ["Refine", "Test, optimize, and polish the experience before handoff."],
  ],
  fr: [
    ["Découvrir", "Comprendre le problème, le public, les contraintes et les objectifs."],
    ["Concevoir", "Définir la structure, les parcours, les composants et l’expérience utilisateur."],
    ["Développer", "Construire l’interface, relier le backend et valider le comportement de l’application."],
    ["Affiner", "Tester, optimiser et peaufiner l’expérience avant la livraison."],
  ],
} as const;

export default function AboutWorkflow() {
  const { lang } = useLanguage();
  const currentPhases = phases[lang] ?? phases.en;

  return (
    <section className={styles.workflow} aria-labelledby="about-workflow-heading" data-about-reveal>
      <header className={styles.workflowHeader}>
        <div className={styles.workflowMeta}>
          <span className={styles.workflowBadge}>PROCESS METHODOLOGY</span>
          <span className={styles.workflowSub}>{lang === "fr" ? "Cycle d'ingénierie en 4 étapes" : "4-Stage Engineering Cycle"}</span>
        </div>
        <h3 id="about-workflow-heading">{lang === "fr" ? "Ma façon de travailler" : "How I Work"}</h3>
      </header>

      {/* Connected architectural progression line */}
      <div className={styles.workflowRail} aria-hidden="true">
        <span className={styles.railLine} />
        {currentPhases.map((_, index) => (
          <span key={index} className={styles.railNode}>
            <span className={styles.railDot} />
          </span>
        ))}
      </div>

      <ol className={styles.workflowGrid} role="list">
        {currentPhases.map(([name, description], index) => {
          const Icon = icons[index];
          return (
            <li key={name} className={styles.workflowCard} data-about-step>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap} aria-hidden="true">
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <span className={styles.cardNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h4 className={styles.cardTitle}>{name}</h4>
              <p className={styles.cardDesc}>{description}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
