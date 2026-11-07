"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Boxes, Network, Orbit, PanelTop, Play, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import CountUp from "@/components/CountUp";
import { stackChips } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import "./scrollplay.css";

const colors = ["#e8be72", "#72dce4", "#ef9cb9", "#b6a1ff", "#86d9b5", "#edbd7e", "#9ad9ed"];
const destinations = ["#about", "#projects", "#services", "#skills", "#projects", "#services", "#contact"];
const symbols = [Zap, PanelTop, Boxes, ShieldCheck, Orbit, Workflow, Network, Sparkles];

/** A sticky, scroll-controlled story. Scroll position selects a chapter; no autoplay or heavy rendering. */
export default function ScrollPlay(): React.JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number>(0);
  const [active, setActive] = useState(0);
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const chapters = t.play.chapters;
  const total = chapters.length + 1;

  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const stage = root.querySelector<HTMLElement>(".scrollplay-stage");
      const travel = Math.max(1, rect.height - (stage?.offsetHeight ?? window.innerHeight));
      const stickyTop = stage ? stage.getBoundingClientRect().top : 0;
      const progress = Math.min(1, Math.max(0, (stickyTop - rect.top) / travel));
      setActive(Math.min(total - 1, Math.round(progress * (total - 1))));
    };
    const onScroll = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => { frameRef.current = 0; update(); });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frameRef.current); };
  }, [total]);

  const jump = (index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const stage = root.querySelector<HTMLElement>(".scrollplay-stage");
    const travel = Math.max(1, root.offsetHeight - (stage?.offsetHeight ?? window.innerHeight));
    const stickyTop = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
    const top = root.getBoundingClientRect().top + window.scrollY - stickyTop + travel * index / Math.max(1, total - 1);
    window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  };
  const visit = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  const chapter = chapters[active];
  const color = colors[active % colors.length];
  const Symbol = symbols[active] ?? Sparkles;

  return <section id="scrollplay" ref={rootRef} aria-label={t.play.hint} className="scrollplay-film" style={{ height: `${100 + Math.max(total - 1, 1) * 64}svh`, "--play-color": color } as React.CSSProperties}>
    <div className="scrollplay-stage">
      <div className="scrollplay-ambient" aria-hidden="true" />
      <div className="scrollplay-layout">
        <header className="scrollplay-header">
          <span className="scrollplay-brand"><Play size={15} fill="currentColor" aria-hidden="true" /> BUDI / {lang === "fr" ? "L'HISTOIRE" : "THE STORY"}</span>
          <span className="scrollplay-chapter-number">{String(active + 1).padStart(2, "0")} <i>/</i> {String(total).padStart(2, "0")}</span>
        </header>
        <div className="scrollplay-main" aria-live="polite">
          <div className={`scrollplay-visual scrollplay-visual--${active}`} aria-hidden="true">
            <div className="scrollplay-art"><span className="scrollplay-art-line scrollplay-art-line-a" /><span className="scrollplay-art-line scrollplay-art-line-b" /><span className="scrollplay-art-node scrollplay-art-node-a" /><span className="scrollplay-art-node scrollplay-art-node-b" /><span className="scrollplay-art-node scrollplay-art-node-c" /><div className="scrollplay-art-core"><Symbol size={54} strokeWidth={1.2} /></div><span className="scrollplay-art-caption">BUDI / {String(active + 1).padStart(2, "0")}</span></div>
          </div>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={`${lang}-${active}`} className="scrollplay-slide" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? { opacity: 1 } : { opacity: 0, y: -12 }} transition={{ duration: reduced ? 0 : .24, ease: [0.22, 1, 0.36, 1] }}>
              <p className="scrollplay-kicker"><Sparkles size={15} aria-hidden="true" /> {chapter?.kicker ?? t.play.finaleKicker}</p>
              <h2>{chapter ? <><span>{chapter.a}</span><em>{chapter.b}</em></> : <><span>{t.play.finaleA}</span><em>{t.play.finaleB}</em></>}</h2>
              <p className="scrollplay-body">{chapter?.body ?? t.play.note}</p>
              {chapter ? <button type="button" className="scrollplay-visit" onClick={() => visit(destinations[active] ?? "#contact")}>{lang === "fr" ? "Explorer ce chapitre" : "Explore this chapter"}<ArrowUpRight size={18} aria-hidden="true" /></button> : <div className="scrollplay-finale"><div className="scrollplay-stats"><span><CountUp end={stackChips.length} /> <small>{t.play.stats.tech}</small></span><span><CountUp end={3} /> <small>{t.play.stats.lang}</small></span><span><CountUp end={t.hero.roles.length} /> <small>{t.play.stats.spec}</small></span></div><a href="#contact" className="scrollplay-visit">{t.play.cta}<ArrowUpRight size={18} aria-hidden="true" /></a></div>}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="scrollplay-footer">
          <p><ArrowDown size={14} aria-hidden="true" /> {lang === "fr" ? "Faites défiler pour découvrir" : "Scroll to reveal the story"}</p>
          <nav aria-label={lang === "fr" ? "Chapitres de l'histoire" : "Story chapters"} className="scrollplay-dots">{Array.from({ length: total }, (_, i) => <button key={i} type="button" onClick={() => jump(i)} aria-label={`${lang === "fr" ? "Chapitre" : "Chapter"} ${i + 1}`} aria-current={i === active ? "step" : undefined}><span /></button>)}</nav>
          <span className="scrollplay-progress-label">{Math.round((active + 1) / total * 100)}%</span>
        </footer>
      </div>
      <div className="scrollplay-progress" aria-hidden="true"><span style={{ width: `${(active + 1) / total * 100}%` }} /></div>
    </div>
  </section>;
}
