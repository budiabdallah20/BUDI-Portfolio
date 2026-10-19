"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Sparkles, X } from "lucide-react";
import Logo from "@/components/Logo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const COPY = {
  en: {
    kicker: "BUDI app",
    title: "Install for one-tap access",
    sub: "Home-screen icon · opens like a native app",
    action: "Install",
    close: "Dismiss install banner",
  },
  fr: {
    kicker: "App BUDI",
    title: "Installez pour un accès en un tap",
    sub: "Icône sur l'écran d'accueil · comme une app native",
    action: "Installer",
    close: "Fermer la bannière d'installation",
  },
} as const;

/** Snooze for the rest of the tab session — one polite ask, never a nag. */
const DISMISS_KEY = "budi-install-dismissed";

/**
 * InstallBanner — the real answer to Chrome's
 * "Banner not shown: beforeinstallpromptevent.preventDefault() called".
 *
 * The browser fires `beforeinstallprompt` once the app is installable;
 * PwaRegister stashes it and re-broadcasts `budi:installable`. This banner
 * is the surface that finally calls `prompt()` — so an install prompt is
 * actually offered (and Chromium stops complaining), instead of the event
 * being swallowed into a hidden global.
 *
 * Only ever appears when the app is genuinely installable: on iOS Safari
 * (no such event) it stays silent rather than faking a button.
 */
export default function InstallBanner(): React.JSX.Element | null {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);
  const t = lang === "fr" ? COPY.fr : COPY.en;

  useEffect(() => {
    try {
      dismissed.current = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage blocked — treat as fresh session */
    }
    const onInstallable = (): void => {
      if (!dismissed.current) setVisible(true);
    };
    window.addEventListener("budi:installable", onInstallable);
    // The event may already have fired before this component mounted.
    if (window.__budiInstallPrompt && !dismissed.current) setVisible(true);
    return (): void => {
      window.removeEventListener("budi:installable", onInstallable);
    };
  }, []);

  const dismiss = (): void => {
    dismissed.current = true;
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage blocked — the banner simply returns next session */
    }
  };

  const install = async (): Promise<void> => {
    const event = window.__budiInstallPrompt;
    setVisible(false);
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      /* user closed the native sheet — nothing to undo */
    }
    // A prompt can only be consumed once.
    window.__budiInstallPrompt = undefined;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="status"
          aria-live="polite"
          aria-label={t.title}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[4.75rem] left-1/2 z-[95] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:top-[7.5rem]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-background/85 p-3 shadow-[0_30px_80px_-30px_rgba(255,61,0,0.55)] backdrop-blur-xl">
            {/* Gold crown hairline */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                boxShadow: "0 0 16px color-mix(in srgb, var(--accent) 55%, transparent)",
              }}
            />
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/[0.08]">
                <Logo className="h-7 w-7 [&_svg]:h-7 [&_svg]:w-7" />
                {!reduced && (
                  <span aria-hidden="true" className="animate-ping-soft absolute inset-0 rounded-xl border border-accent/40" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-accent uppercase">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t.kicker}
                </span>
                <span className="mt-0.5 block truncate text-[13px] leading-tight font-bold text-foreground">
                  {t.title}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] tracking-[0.12em] text-faint uppercase">
                  {t.sub}
                </span>
              </span>

              <button
                type="button"
                onClick={() => void install()}
                className="group/install flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2.5 text-[12px] font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover/install:translate-y-0.5" aria-hidden="true" />
                {t.action}
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t.close}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
