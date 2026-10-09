"use client";

import { useEffect, useState } from "react";

/** True when the OS requests reduced motion. Safe for SSR (defaults to false). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches);
    };
    query.addEventListener("change", onChange);
    return (): void => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}
