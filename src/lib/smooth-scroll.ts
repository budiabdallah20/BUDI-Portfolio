"use client";

import Lenis from "lenis";

let instance: Lenis | null = null;

/** Create the single shared Lenis instance (no-op for reduced motion / SSR). */
export function initSmoothScroll(): Lenis | null {
  if (typeof window === "undefined" || instance) return instance;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  instance = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.25,
    syncTouch: false,
  });
  return instance;
}

export function getLenis(): Lenis | null {
  return instance;
}

export function destroySmoothScroll(): void {
  instance?.destroy();
  instance = null;
}

/** Animated, offset-aware scroll used by the cinematic side rail. */
export function scrollToId(id: string, offset = -104): void {
  if (typeof window === "undefined") return;
  const target = document.getElementById(id);
  if (!target) return;
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.25 });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
