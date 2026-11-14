"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function FeaturedGallery({ names, label, render, peek, className }: {
  names: string[];
  label: string;
  render: (index: number) => ReactNode;
  peek: (index: number) => ReactNode;
  className: string;
}) {
  const { lang } = useLanguage();
  const [position, setPosition] = useState({ index: 0, step: 1 });
  const controls = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const count = names.length;
  if (!count) return null;
  const index = position.index % count;
  const next = (index + 1) % count;
  const move = (step: number) => setPosition(current => ({ index: (current.index + step + count) % count, step }));
  const format = new Intl.NumberFormat(lang, { minimumIntegerDigits: 2 });
  return <div className={`featured-gallery ${className}`} role="group" aria-label={label}
    onKeyDown={event => {
      if (count < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if ((event.target as HTMLElement).closest(".featured-artifact")) controls.current?.querySelector("button")?.focus({ preventScroll: true });
        move(direction * (event.key === "ArrowRight" ? 1 : -1));
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        if ((event.target as HTMLElement).closest(".featured-artifact")) controls.current?.querySelector("button")?.focus({ preventScroll: true });
        setPosition({ index: event.key === "Home" ? 0 : count - 1, step: event.key === "Home" ? -1 : 1 });
      }
    }}>
    <div className="featured-controls">
      <span className="featured-position" aria-live="polite">{format.format(index + 1)} / {format.format(count)}<span className="sr-only"> · {names[index]}</span></span>
      <span className="featured-progress" aria-hidden="true"><span style={{ inlineSize: `${((index + 1) / count) * 100}%` }} /></span>
      {count > 1 && <div className="featured-arrows" ref={controls}>
        <button type="button" onClick={() => move(-1)} aria-label={lang === "fr" ? "Précédent" : "Previous"}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" onClick={() => move(1)} aria-label={lang === "fr" ? "Suivant" : "Next"}><ArrowRight aria-hidden="true" /></button>
      </div>}
    </div>
    <div className={`featured-stage${count > 1 ? " has-peek" : ""}`}
      onTouchStart={event => { suppressClick.current = false; touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={event => {
        const origin = touch.current;
        touch.current = null;
        if (!origin || count < 2) return;
        const dx = event.changedTouches[0].clientX - origin.x;
        const dy = event.changedTouches[0].clientY - origin.y;
        if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        suppressClick.current = true;
        move((dx < 0 ? 1 : -1) * (getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1));
      }}
      onClickCapture={event => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        if (event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
      }}>
      <div className="featured-artifact" key={index} data-step={position.step}>{render(index)}</div>
      {count > 1 && <>
        <span key={`route-${index}`} className="featured-route" data-step={position.step} aria-hidden="true" />
        <button type="button" className="featured-peek" onClick={() => move(1)} aria-label={names[next]}>
          <span className="featured-peek-art" aria-hidden="true">{peek(next)}</span>
          <span className="featured-peek-label">{names[next]}</span>
        </button>
      </>}
    </div>
  </div>;
}
