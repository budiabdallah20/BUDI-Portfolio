"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { useLanguage } from "@/components/providers/LanguageProvider";

const seen = "budi-editorial-intro";

export default function EditorialLoader({ enabled, onReady }: { enabled: boolean; onReady: (ready: boolean) => void }) {
  const { lang, t } = useLanguage();
  const [active, setActive] = useState(enabled);
  const [step, setStep] = useState(0);
  const counter = useRef<HTMLSpanElement>(null);
  const displayed = useRef(0);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    if (!active || !counter.current) return;
    const start = displayed.current;
    const started = performance.now();
    let frame = 0;
    const advance = (now: number) => {
      const progress = Math.min(1, (now - started) / (step === 100 ? 260 : 780));
      displayed.current = Math.round(start + (step - start) * (1 - (1 - progress) ** 2));
      if (counter.current) counter.current.textContent = String(displayed.current).padStart(2, "0");
      if (progress < 1) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [active, step]);

  useEffect(() => {
    if (!active) { onReady(true); return; }
    let visited = false;
    try { visited = sessionStorage.getItem(seen) === "1"; } catch { /* optional storage */ }
    if (!enabled || visited || matchMedia("(prefers-reduced-motion: reduce)").matches || location.hash) {
      setActive(false);
      onReady(true);
      return;
    }
    let cancelled = false;
    let complete = false;
    let exitTimer = 0;
    let milestones = 0;
    const finish = () => {
      if (cancelled || complete) return;
      complete = true;
      setStep(100);
      exitTimer = window.setTimeout(() => { setReleased(true); onReady(true); }, 360);
      try { sessionStorage.setItem(seen, "1"); } catch { /* optional storage */ }
    };
    const mark = () => {
      if (cancelled || complete) return;
      milestones++;
      setStep(24 + 26 * milestones);
    };
    setStep(24);
    const fonts = document.fonts.ready.then(mark, mark);
    const portrait = document.querySelector<HTMLImageElement>(".editorial-portrait img");
    const photo = portrait ? portrait.decode().then(mark, mark) : Promise.resolve().then(mark);
    const minimum = window.setTimeout(() => void Promise.all([fonts, photo]).then(finish), 1460);
    const timeout = window.setTimeout(finish, 2750);
    return () => {
      cancelled = true;
      window.clearTimeout(minimum);
      window.clearTimeout(timeout);
      window.clearTimeout(exitTimer);
    };
  }, [active, enabled, onReady]);

  if (!active) return null;
  return (
    <div className="editorial-loader" style={{ "--loader-progress": step / 100 } as React.CSSProperties} data-loader-root="editorial" data-loader-released={released ? "1" : undefined} data-step={step}>
      <div className="editorial-loader-stage"><Logo variant="full" className="editorial-loader-logo" /></div>
      <button type="button" onClick={() => {
        try { sessionStorage.setItem(seen, "1"); } catch { /* optional storage */ }
        setActive(false);
        onReady(true);
        document.getElementById("hero-heading")?.focus({ preventScroll: true });
      }}>{t.loader.skip}</button>
      <span ref={counter} className="editorial-loader-count" aria-hidden="true">00</span>
      <span className="sr-only">{lang === "fr" ? "Ouverture du portfolio" : "Opening portfolio"}</span>
    </div>
  );
}
