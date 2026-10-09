"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy for the navbar. Observes whichever section anchors
 * actually exist in the DOM (future sections mount later without
 * breaking the current nav), falling back to "home" at the top.
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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return (): void => observer.disconnect();
  }, [key]);

  return active;
}
