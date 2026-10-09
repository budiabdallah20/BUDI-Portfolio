"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
}

/**
 * Animated counter — ease-out count on first scroll into view.
 * Plain toFixed rendering keeps SSR and hydration byte-identical.
 */
export default function CountUp({ end, duration = 1400, className }: CountUpProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      setValue(end);
      return;
    }
    let raf = 0;
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          const t0 = performance.now();
          const step = (t: number): void => {
            const progress = Math.min(1, (t - t0) / duration);
            setValue(end * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return (): void => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {Math.round(value)}
    </span>
  );
}
