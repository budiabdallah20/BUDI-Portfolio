"use client";

import { useEffect, useState } from "react";
import type { WeatherGroup } from "@/i18n/dictionaries";

export interface Weather {
  tempC: number;
  group: WeatherGroup;
}

const SUEZ_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=29.97&longitude=32.55&current=temperature_2m,weather_code&timezone=Africa%2FCairo";
const REFRESH_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;

function groupOf(code: number): WeatherGroup {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "partly";
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: unknown; weather_code?: unknown };
}

/**
 * Real Suez weather via Open-Meteo (free, keyless, CORS-open).
 * Any failure — offline, timeout, bad shape — resolves to null and the
 * bar renders its quiet "--" fallback instead of crashing.
 */
export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async (): Promise<void> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(SUEZ_URL, { signal: controller.signal });
        if (!res.ok) return;
        const json = (await res.json()) as OpenMeteoResponse;
        const temp = json.current?.temperature_2m;
        const code = json.current?.weather_code;
        if (typeof temp !== "number" || typeof code !== "number") return;
        if (alive) setWeather({ tempC: Math.round(temp), group: groupOf(code) });
      } catch {
        /* network down — fallback UI covers it */
      } finally {
        window.clearTimeout(timer);
      }
    };

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return (): void => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return weather;
}
