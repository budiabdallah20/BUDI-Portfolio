"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

/**
 * BUDI OS global splash — the FIRST thing on /admin, shared by every
 * project. Luxurious dark opening: BUDI mark in a conic ring, BUDI OS
 * wordmark, bilingual tagline, thin progress rail. Pure CSS motion +
 * one timer; reduced-motion users get a static frame that still lifts.
 */
export default function GlobalSplash({
  workspaces,
  onComplete,
}: {
  workspaces: number;
  onComplete: () => void;
}): React.JSX.Element {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  const finishedRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let done = false;
    const reduced = (() => {
      try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return true;
      }
    })();
    if (reduced) {
      setProgress(100);
      const t = window.setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          doneRef.current();
        }
      }, 600);
      return (): void => {
        done = true;
        window.clearTimeout(t);
      };
    }
    const start = performance.now();
    const DURATION = 2300;
    const tick = (now: number): void => {
      if (done) return;
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(Math.round(p * 100));
      if (p >= 1) {
        window.setTimeout(() => {
          if (!finishedRef.current) {
            finishedRef.current = true;
            doneRef.current();
          }
        }, 250);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return (): void => {
      done = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      data-loader-root="budi-os"
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden bg-[#0a0a0b] text-white"
      role="status"
      aria-label="BUDI OS loading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 38%, rgba(255,61,0,0.14), transparent 65%), linear-gradient(130deg, #0a0a0b 0%, #160c04 40%, #0d1407 70%, #0a0a0b 100%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="animate-aurora-a absolute -top-[15%] left-[10%] h-[45vmax] w-[45vmax] rounded-full bg-[#ff3d00]/15 blur-[110px]" />
        <div className="animate-aurora-b absolute -right-[10%] -bottom-[15%] h-[40vmax] w-[40vmax] rounded-full bg-[#bef264]/10 blur-[110px]" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <span className="relative flex h-24 w-24 items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-spin-conic absolute inset-0 rounded-full opacity-80"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, #ff3d00 20%, #d7fd44 40%, transparent 60%, transparent 75%, #38bdf8 90%, transparent 100%)",
              filter: "blur(6px)",
            }}
          />
          <span aria-hidden="true" className="absolute inset-[4px] rounded-full bg-[#0a0a0b]" />
          <span className="relative scale-150">
            <Logo />
          </span>
        </span>

        <p className="font-display mt-6 text-4xl font-black tracking-tight sm:text-5xl">
          BUDI <span className="text-accent">OS</span>
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[0.32em] text-white/45 uppercase">
          مركز قيادة المشاريع · Command Center
        </p>

        <div className="mt-7 h-[3px] w-56 overflow-hidden rounded-full bg-white/10 sm:w-72">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff3d00] via-[#d7fd44] to-[#38bdf8] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 font-mono text-[11px] tracking-[0.24em] text-white/40 tabular-nums">
          {progress}% · {workspaces} {workspaces === 1 ? "workspace" : "workspaces"}
        </p>
      </div>
    </div>
  );
}
