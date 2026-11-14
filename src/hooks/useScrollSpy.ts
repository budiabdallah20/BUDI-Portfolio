"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy for the navbar. Position-based, not intersection-based:
 * deterministic even when several sections overlap the viewport — the
 * active item is the section occupying the most of the readable viewport.
 * This keeps the highlight aligned with what the visitor actually sees
 * while moving between the museum's tall exhibition rooms. Reaching the page bottom always
 * lands on the final section (contact), and the very top is "home".
 * rAF-throttled, passive listeners — no scroll jank.
 *
 * Pure in-memory spy — nothing is persisted. Every visit starts fresh
 * at the top like the first time.
 */
export function useScrollSpy(ids: string[]): string {
  const key = ids.join("|");
  const [active, setActive] = useState<string>(ids[0] ?? "home");

  useEffect(() => {
    const list = key.split("|");
    const targets = list
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    let raf = 0;
    const compute = (): void => {
      const top = Math.min(90, window.innerHeight * 0.12);
      const bottom = window.innerHeight * 0.88;
      let current = list[0];
      let bestVisible = 0;
      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        const visible = Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
        if (visible > bestVisible) { bestVisible = visible; current = el.id; }
        else if (bestVisible === 0 && rect.top <= top) current = el.id;
      }
      // Bottom of page — always pin the last section, whatever the math says.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 8) {
        current = targets[targets.length - 1].id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = (): void => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(compute);
    };

    const observer = new IntersectionObserver(onScroll, { rootMargin: "-120px 0px -15% 0px", threshold: [0, 0.1, 0.5] });
    targets.forEach(target => observer.observe(target));
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    return (): void => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, [key]);

  return active;
}
