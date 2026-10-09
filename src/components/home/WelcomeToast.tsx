"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import Logo from "@/components/Logo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { profile } from "@/data/portfolio";

const COPY = {
  en: {
    eyebrow: "Welcome to my portfolio",
    title: "Hey, I'm BUDI",
    sub: "Mohamed Abdallah — Full-Stack Developer from Suez, Egypt. I build fast, modern web apps.",
    hire: "Hire me",
    work: "View work",
    dismiss: "Dismiss welcome message",
  },
  fr: {
    eyebrow: "Bienvenue sur mon portfolio",
    title: "Salut, c'est BUDI",
    sub: "Mohamed Abdallah — Développeur Full-Stack à Suez, Égypte. Je crée des apps web rapides et modernes.",
    hire: "Me recruter",
    work: "Voir mes projets",
    dismiss: "Fermer le message de bienvenue",
  },
} as const;

/** How long the card stays before it bows out on its own. */
const DURATION_MS = 6000;

/**
 * WelcomeToast — the handshake card. Shows on EVERY visit (no storage,
 * mounts fresh with the shell), introduces BUDI with the logo seal, then
 * bows out on its own. Hover pauses the countdown, X / ESC dismisses
 * instantly, CTAs dismiss on the way to their section.
 */
export default function WelcomeToast(): React.JSX.Element {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const remainingRef = useRef(DURATION_MS);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const t = lang === "fr" ? COPY.fr : COPY.en;
  const dismiss = (): void => setVisible(false);

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const armTimer = (ms: number): void => {
    clearTimer();
    remainingRef.current = ms;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, ms);
  };

  useEffect(() => {
    armTimer(DURATION_MS);
    return clearTimer;
    // Run once per mount — every visit gets exactly one hello.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKey);
    return (): void => {
      document.removeEventListener("keydown", onKey);
    };
  }, [visible]);

  /** Hover pauses the countdown — resume with whatever is left. */
  const onEnter = (): void => {
    if (timerRef.current === null) return;
    clearTimer();
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current),
    );
  };
  const onLeave = (): void => {
    if (!visible || remainingRef.current <= 0) return;
    armTimer(remainingRef.current);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="status"
          aria-live="polite"
          aria-label={t.eyebrow}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="group/welcome fixed right-5 bottom-5 left-5 z-[90] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[380px]"
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), rgba(10,10,11,0.88)",
              boxShadow:
                "0 40px 100px -20px rgba(0,0,0,0.9), 0 20px 50px -20px rgba(215,253,68,0.25)",
            }}
          >
            {/* Accent crown — BUDI lime, same language as the glass dossiers */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--accent), transparent)",
                boxShadow: "0 0 18px rgba(215,253,68,0.55)",
              }}
            />
            <button
              type="button"
              onClick={dismiss}
              aria-label={t.dismiss}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/60 backdrop-blur-md transition-all hover:rotate-90 hover:border-accent hover:text-accent"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div className="flex items-start gap-3.5 p-5">
              {/* Logo seal */}
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 shadow-[0_0_26px_rgba(215,253,68,0.3)]">
                <Logo />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.24em] text-accent uppercase">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t.eyebrow}
                </p>
                <p className="font-display mt-1 text-xl leading-tight font-bold text-foreground">
                  {t.title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  {t.sub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-5 pb-4">
              <a
                href="#contact"
                onClick={dismiss}
                className="group/cta relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-black/25 blur-md transition-transform duration-700 group-hover/cta:translate-x-[380%]"
                />
                <span className="relative">{t.hire}</span>
                <ArrowUpRight className="relative h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href="#projects"
                onClick={dismiss}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-bold text-white/70 transition-colors duration-200 hover:border-accent/60 hover:text-accent"
              >
                {t.work}
              </a>
            </div>

            {/* Auto-dismiss progress — pauses with the countdown on hover */}
            <div aria-hidden="true" className="h-[2px] bg-white/[0.07]">
              {!reduced && (
                <span
                  className="playfill block h-full w-full origin-left bg-gradient-to-r from-accent via-accent to-ember group-hover/welcome:[animation-play-state:paused]"
                  style={{ animationDuration: `${DURATION_MS}ms` }}
                />
              )}
            </div>
            <span className="sr-only">{profile.name} — Suez, EG</span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
