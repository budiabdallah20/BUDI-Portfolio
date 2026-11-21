"use client";

import { useState, type KeyboardEvent } from "react";
import styles from "./about-editorial.module.css";

const CATEGORIES = {
  en: ["CRAFT & INTERFACE", "SYSTEM & RESILIENCE", "SECURITY & HORIZONS"],
  fr: ["ARTISANAT & INTERFACE", "SYSTÈME & RÉSILIENCE", "SÉCURITÉ & HORIZONS"],
} as const;

export default function AboutChapters({
  labels,
  story,
  title,
  lang = "en",
}: {
  labels: readonly string[];
  story: readonly string[];
  title: string;
  lang?: "en" | "fr";
}) {
  const [selected, setSelected] = useState(0);
  const categories = CATEGORIES[lang] ?? CATEGORIES.en;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
    let next: number;
    switch (event.key) {
      case "Home":
        next = 0;
        break;
      case "End":
        next = story.length - 1;
        break;
      case "ArrowLeft":
        next = (index - direction + story.length) % story.length;
        break;
      case "ArrowRight":
        next = (index + direction + story.length) % story.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelected(next);
    document.getElementById("about-chapter-tab-" + next)?.focus();
  }

  return (
    <div className={styles.chapterReader} data-about-reveal>
      {/* Chapter navigation tabs */}
      <div className={styles.chapterTabs} role="tablist" aria-label={title}>
        {story.map((_, index) => {
          const isSelected = selected === index;
          return (
            <button
              type="button"
              role="tab"
              key={index}
              id={"about-chapter-tab-" + index}
              aria-controls={"about-chapter-" + index}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(event) => navigate(event, index)}
              onClick={() => setSelected(index)}
              className={isSelected ? styles.chapterTabActive : styles.chapterTab}
            >
              <div className={styles.tabTopRow}>
                <span className={styles.tabNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.tabKicker}>{categories[index]}</span>
              </div>
              <strong className={styles.tabTitle}>{labels[index]}</strong>
              <span className={styles.tabIndicator} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Chapter content panels */}
      <div className={styles.chapterBodyContainer}>
        {story.map((paragraph, index) => {
          const firstSentenceEnd = paragraph.indexOf(". ") + 1;
          const lead = firstSentenceEnd > 0 ? paragraph.slice(0, firstSentenceEnd) : paragraph;
          const rest = firstSentenceEnd > 0 ? paragraph.slice(firstSentenceEnd) : "";
          const isCurrent = index === selected;

          return (
            <article
              key={index}
              role="tabpanel"
              id={"about-chapter-" + index}
              aria-labelledby={"about-chapter-tab-" + index}
              tabIndex={0}
              hidden={!isCurrent}
              className={styles.chapter}
            >
              <header className={styles.chapterHeader}>
                <div className={styles.chapterMetaLine}>
                  <span className={styles.chapterBadge}>
                    CHAPTER {String(index + 1).padStart(2, "0")} / 03
                  </span>
                  <span className={styles.chapterCategoryLabel}>{categories[index]}</span>
                </div>
                <h4 className={styles.chapterHeading}>{labels[index]}</h4>
              </header>

              <div className={styles.chapterText}>
                <p className={styles.chapterLead}>
                  <strong>{lead}</strong>
                  {rest && <span className={styles.chapterRest}>{rest}</span>}
                </p>
              </div>

              <footer className={styles.chapterFooter}>
                <div className={styles.chapterProgressRail} aria-hidden="true">
                  {story.map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className={
                        dotIndex === selected
                          ? styles.chapterProgressDotActive
                          : dotIndex < selected
                          ? styles.chapterProgressDotPast
                          : styles.chapterProgressDot
                      }
                    />
                  ))}
                </div>
                <span className={styles.chapterFooterNote}>
                  {lang === "fr" ? "Récit narratif vérifié" : "Verified personal narrative"}
                </span>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
