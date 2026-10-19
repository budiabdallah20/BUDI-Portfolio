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
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="group/welcome fixed right-4 bottom-4 left-4 z-[90] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[360px]"
        >
          {/* Soft glow halo behind the card */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 rounded-[2rem] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(60% 60% at 30% 40%, rgba(215,253,68,0.22), transparent 70%), radial-gradient(50% 50% at 80% 70%, rgba(255,61,0,0.18), transparent 70%)",
            }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            {/* Top accent line */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--accent), transparent)",
                boxShadow: "0 0 12px rgba(215,253,68,0.5)",
              }}
            />
            {!reduced && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <span className="logo-sheen absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </span>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label={t.dismiss}
              className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/50 backdrop-blur-md transition-all hover:border-accent hover:text-accent"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>

            <div className="flex items-start gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08] shadow-[0_0_18px_rgba(215,253,68,0.25)]">
                <Logo className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.22em] text-accent uppercase">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  {t.eyebrow}
                </p>
                <p className="font-display mt-0.5 text-base leading-tight font-bold text-foreground">
                  {t.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {t.sub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 pb-3">
              <a
                href="#contact"
                onClick={dismiss}
                className="group/cta relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-accent px-3.5 py-2 text-[12px] font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="relative">{t.hire}</span>
                <ArrowUpRight className="relative h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="#projects"
                onClick={dismiss}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-[12px] font-bold text-white/60 transition-colors duration-200 hover:border-accent/50 hover:text-accent"
              >
                {t.work}
              </a>
            </div>

            <div aria-hidden="true" className="h-[2px] bg-white/[0.06]">
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
