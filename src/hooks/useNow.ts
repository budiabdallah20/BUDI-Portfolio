"use client";

import { useEffect, useState } from "react";

/** Live clock tick. Null until mounted — the bar renders a stable placeholder
 *  during SSR/first paint so hydration never mismatches on live time. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const frame = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, intervalMs);
    return (): void => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
