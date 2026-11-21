"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { scrollToId } from "@/lib/smooth-scroll";

export type RailItem = {
  id: string;
  label: string;
  number: string;
};

/** Floating glass rail: one glowing node per project. */
export default function CinematicRail({ items }: { items: RailItem[] }): React.JSX.Element {
  const { lang } = useLanguage();
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!items.length) return;
    let frame = 0;
    const update = (): void => {
      const marker = window.innerHeight * 0.42;
      let current = items[0].id;
      for (const item of items) {
        const element = document.getElementById(item.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= marker) current = item.id;
      }
      setActive(current);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0);
    };
    const schedule = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav className="cine-rail" aria-label={lang === "fr" ? "Navigation des projets" : "Project navigation"}>
      <span className="cine-rail-cap" aria-hidden="true" />
      <span className="cine-rail-track" aria-hidden="true">
        <span style={{ transform: `scaleY(${progress})` }} />
      </span>
      <ul className="cine-rail-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="cine-rail-node cine-rail-node--project"
              aria-current={active === item.id ? "location" : undefined}
              aria-label={item.label}
              onClick={() => scrollToId(item.id)}
            >
              <span className="cine-rail-halo" aria-hidden="true" />
              <span className="cine-rail-index">{item.number}</span>
              <span className="cine-rail-tooltip" aria-hidden="true"><span>{item.label}</span><ArrowUpRight size={12} /></span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="cine-rail-home" onClick={() => scrollToId("home")} aria-label={lang === "fr" ? "Accueil" : "Back to top"}>
        <ArrowUpRight size={15} aria-hidden="true" />
      </button>
    </nav>
  );
}
