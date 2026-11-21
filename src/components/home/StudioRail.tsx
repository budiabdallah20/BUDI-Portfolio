"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const acts = [
  ["home", "Home", "Accueil"],
  ["about", "About", "À propos"],
  ["services", "Services and skills", "Services et compétences"],
  ["projects", "Projects", "Projets"],
  ["support", "Support", "Soutien"],
  ["certificates", "Certificates", "Certificats"],
] as const;

export default function StudioRail() {
  const { lang } = useLanguage();
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = [...acts.map(([id]) => id), "skills", "contact"]
      .map(id => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const update = () => {
      const marker = window.innerHeight * 0.38;
      const current = sections
        .map(section => ({ id: section.id, bounds: section.getBoundingClientRect() }))
        .filter(({ id, bounds }) => bounds.top <= marker && (id !== "support" || bounds.bottom > marker))
        .sort((left, right) => right.bounds.top - left.bounds.top)[0];
      setActive(current?.id === "skills" ? "services" : current?.id ?? "home");
    };
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(schedule);
    sections.forEach(section => observer.observe(section));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav className="studio-rail" aria-label={lang === "fr" ? "Chapitres" : "Chapters"}>
      {acts.map(([id, en, fr], index) => (
        <a key={id} href={"#" + id} aria-current={active === id ? "location" : undefined}
          aria-label={lang === "fr" ? fr : en} title={lang === "fr" ? fr : en}>
          {String(index + 1).padStart(2, "0")}
        </a>
      ))}
    </nav>
  );
}
