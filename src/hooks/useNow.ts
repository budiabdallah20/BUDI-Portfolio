"use client";

import { useEffect, useState } from "react";

/** Live clock tick. Null until mounted — the bar renders a stable placeholder
 *  during SSR/first paint so hydration never mismatches on live time. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return (): void => {
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
