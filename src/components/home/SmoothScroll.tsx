"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { destroySmoothScroll, initSmoothScroll } from "@/lib/smooth-scroll";

/**
 * Boots Lenis once the intro curtain lifts and drives it from GSAP's ticker so
 * ScrollTrigger, every parallax beam and the sticky card deck share ONE clock.
 */
export default function SmoothScroll({ ready }: { ready: boolean }): null {
  useEffect(() => {
    if (!ready) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = initSmoothScroll();
    if (!lenis) return;

    const onScroll = (): void => ScrollTrigger.update();
    const tick = (time: number): void => lenis.raf(time * 1000);

    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Layout just changed (curtain gone) — remeasure every trigger.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(refresh);
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      destroySmoothScroll();
    };
  }, [ready]);

  return null;
}
