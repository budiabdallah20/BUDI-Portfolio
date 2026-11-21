"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountUp from "@/components/CountUp";
import "./showcase.css";

export default function ShowcaseSection({ id, number, title, subtitle, count, label, children, studio = false }: {
  id: string; number: string; title: string; subtitle?: string; count: number; label: string; children: ReactNode; studio?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      root.current?.querySelectorAll<HTMLElement>("[data-showcase-reveal]").forEach(node => {
        if (node.getBoundingClientRect().bottom < 0) return;
        gsap.from(node, {
          opacity: .55, y: 18, duration: .72, ease: "power2.out", clearProps: "transform,opacity",
          scrollTrigger: { trigger: node, start: "top 93%", once: true, onEnter: () => node.classList.add("showcase-arrived") },
        });
      });
    });
    return () => media.revert();
  }, []);

  return <section id={id} ref={root} className={studio ? "showcase-section dark-studio" : "showcase-section"} aria-labelledby={id + "-heading"}>
    <div className="showcase-shell">
      <header className="showcase-heading" data-showcase-reveal>
        <div>
          <p className="showcase-index">{number} <span>{label}</span></p>
          <h2 id={id + "-heading"}>{title}</h2>
          {subtitle && <p className="showcase-subtitle">{subtitle}</p>}
        </div>
        <span className="showcase-count"><span className="sr-only">{count} {label}</span><span aria-hidden="true">{count < 10 ? "0" : ""}<CountUp end={count} duration={850} /></span></span>
      </header>
      {children}
    </div>
  </section>;
}
