"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Menu, Search, X } from "lucide-react";
import { navLinks, profile } from "@/data/portfolio";
import { workDeadlineSuffix, workLabel, type SiteAvailability } from "@/components/WorkStatus";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useBodyScrollLock, useTopmostEscape } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import CommandPalette from "./CommandPalette";
import LangFlag from "./LangFlag";
import { dictionaries, type Lang } from "@/i18n/dictionaries";
import Logo from "@/components/Logo";
import UtilityBar from "./UtilityBar";

interface NavbarProps {
  visible: boolean;
  availability?: SiteAvailability;
}
const LANGUAGE_OPTIONS = Object.keys(dictionaries) as Lang[];

/** Per-letter rollover — the reference navbar's signature hover. */
function RollText({ label, rollClassName }: { label: string; rollClassName?: string }): React.JSX.Element {
  const chars = Array.from(label);
  const render = (extra: string, hidden: boolean): React.JSX.Element[] =>
    chars.map((c, i) => (
      <span
        key={i}
        aria-hidden={hidden || undefined}
        className={cn("inline-block transition-transform duration-300 ease-out", extra)}
        style={{ transitionDelay: `${i * 18}ms` }}
      >
        {c === " " ? " " : c}
      </span>
    ));
  return (
    <span className="relative block overflow-hidden">
      <span className="flex">{render("group-hover:-translate-y-full", false)}</span>
      <span aria-hidden="true" className={cn("absolute inset-0 flex", rollClassName)}>
        {render("translate-y-full group-hover:translate-y-0", true)}
      </span>
    </span>
  );
}

function LangButton({ onToggle }: { onToggle?: () => void }): React.JSX.Element {
  const { lang, switchLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const languages = LANGUAGE_OPTIONS;
  const names: Record<Lang, string> = { en: "English", fr: "Français" };
  useEffect(() => {
    if (!open) return;
    optionsRef.current[languages.indexOf(lang)]?.focus();
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open, lang, languages]);
  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = optionsRef.current.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? (index + 1) % languages.length : event.key === "ArrowUp" ? (index - 1 + languages.length) % languages.length : event.key === "Home" ? 0 : event.key === "End" ? languages.length - 1 : -1;
    if (next >= 0) { event.preventDefault(); optionsRef.current[next]?.focus(); }
  };
  return (
    <div ref={rootRef} className="relative">
    <button
      ref={triggerRef}
      type="button"
      onClick={() => {
        setOpen(value => !value);
      }}
      aria-label={lang === "fr" ? "Choisir la langue" : "Choose language"}
      aria-haspopup="menu"
      aria-expanded={open}
      title={lang === "fr" ? "Choisir la langue" : "Choose language"}
      className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:text-foreground"
    >
      <LangFlag lang={lang} />
      <span aria-hidden="true">{lang.toUpperCase()}</span>
    </button>
    {open && <div role="menu" aria-label={lang === "fr" ? "Langues" : "Languages"} onKeyDown={onMenuKeyDown} className="absolute end-0 top-full z-[90] mt-3 min-w-44 rounded-2xl border border-sky-300/25 bg-[#121b29]/95 p-1.5 shadow-[0_20px_55px_#000a,0_0_25px_#75b8e32b] backdrop-blur-xl">
      {languages.map((option, index) => <button key={option} ref={element => { optionsRef.current[index] = element; }} type="button" role="menuitemradio" aria-checked={lang === option} onClick={() => { setOpen(false); onToggle?.(); if (option !== lang) switchLanguage(option); else triggerRef.current?.focus(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-foreground hover:bg-sky-300/10 focus-visible:bg-sky-300/15 focus-visible:outline-none"><LangFlag lang={option}/><span className="flex-1">{names[option]}</span>{lang === option && <span className="text-sky-300" aria-hidden="true">✓</span>}</button>)}
    </div>}
    </div>
  );
}

/** Colored glass capsule grouping search + language controls. */
function ControlCluster({
  onAction,
  onSearch,
}: {
  onAction?: () => void;
  onSearch: () => void;
}): React.JSX.Element {
  const { lang } = useLanguage();
  const searchLabel = lang === "fr" ? "Recherche rapide (Ctrl+K)" : "Quick search (Ctrl+K)";
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-accent/25 bg-gradient-to-r from-accent/[0.14] via-accent/[0.06] to-accent/[0.14] px-2 py-1 shadow-[0_0_24px_rgba(255,61,0,0.14)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_0_36px_rgba(255,61,0,0.3)]">
      <button
        type="button"
        onClick={onSearch}
        aria-label={searchLabel}
        title={searchLabel}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-200 hover:text-accent"
      >
        <Search className="h-[16px] w-[16px]" aria-hidden="true" />
      </button>
      <span
        aria-hidden="true"
        className="mr-1 hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint xl:block"
      >
        ⌘K
      </span>
      <span aria-hidden="true" className="h-4 w-px bg-border" />
      <LangButton onToggle={onAction} />
    </div>
  );
}

export default function Navbar({ visible, availability }: NavbarProps): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { t, lang } = useLanguage();
  const active = useScrollSpy(navLinks.map((l) => l.id));
  /** Dashboard-owned availability — every navbar badge flips with one switch. */
  const avail: SiteAvailability = availability ?? { status: "available", note: "", noteFr: "", until: "" };
  const availLabel =
    workLabel(avail, lang, {
      available: t.hero.available,
      unavailable: t.hero.unavailable,
    }) + workDeadlineSuffix(avail, lang);
  const availLive = avail.status === "available";
  const topLabel = lang === "fr" ? "Retour en haut" : "Back to top";

  useEffect(() => {
    let raf = 0;
    let scheduled = false;
    const onScroll = (): void => {
      if (scheduled) return;
      scheduled = true;
      raf = window.requestAnimationFrame(() => {
        scheduled = false;
        const y = window.scrollY;
        setScrolled(y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
        // Keep the museum compass available throughout the visit.
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return (): void => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  // The address bar always tells the truth about where you stand:
  // /{lang}#{section} — updated in place (no history spam). A deep link
  // that the page hasn't honored yet is never stomped while the page
  // sits untouched at the top.
  useEffect(() => {
    try {
      const current = window.location.hash.replace("#", "");
      if (current === active) return;
      const untouchedDeepLink =
        navLinks.some((l) => l.id === current) && window.scrollY < 8;
      if (untouchedDeepLink) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${active}`);
    } catch {
      /* history unavailable — the spy still works, the URL just stays put */
    }
  }, [active]);

  // Global ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const onKeys = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeys);
    return (): void => {
      document.removeEventListener("keydown", onKeys);
    };
  }, []);

  // Lock background scroll + handle Escape + restore focus.
  // Counted lock + topmost Escape: safe when the palette opens above the menu.
  useBodyScrollLock(open);
  useTopmostEscape(open, () => {
    setOpen(false);
    toggleRef.current?.focus();
  });

  const solid = scrolled || open;
  const shown = visible;

  return (
    <>
      <motion.header
        initial={false}
        animate={shown ? { y: 0, opacity: 1 } : { y: -88, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          solid ? "glass border-b border-border" : "border-b border-transparent bg-transparent",
        )}
      >
        <UtilityBar availability={availability} />
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8 md:h-20"
        >
          <a
            href="#home"
            onClick={() => setOpen(false)}
            className="group relative flex items-center rounded-xl transition-transform duration-300 hover:scale-[1.02]"
            aria-label="BUDI — back to home"
          >
            <Logo
              variant="full"
              className="h-9 w-auto rounded-xl transition-transform duration-300 group-hover:scale-[1.03] sm:h-10"
            />
          </a>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => {
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative block rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors duration-200",
                      isActive ? "text-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                        className="absolute inset-0 rounded-full border border-accent/25 bg-accent/10 shadow-[0_0_20px_rgba(255,61,0,0.28)]"
                      />
                    )}
                    <span className="relative">
                      <RollText label={t.nav[link.id]} rollClassName="text-accent" />
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-4 -bottom-px h-0.5 origin-left rounded-full bg-accent shadow-[0_0_8px_rgba(255,61,0,0.8)] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>


          <div className="hidden items-center gap-2.5 lg:flex">
            {/* Live availability — the navbar breathes with the site */}
            <span
              title={availLabel}
              className={cn(
                "hidden max-w-56 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase xl:flex",
                availLive
                  ? "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-400"
                  : "border-amber-400/40 bg-amber-400/[0.08] text-amber-300",
              )}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span
                  className={cn(
                    "animate-ping-soft absolute inline-flex h-full w-full rounded-full",
                    availLive ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    availLive ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
              </span>
              <span className="truncate">{availLabel}</span>
            </span>
            <ControlCluster onSearch={() => setPaletteOpen(true)} />
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.menu.close : t.menu.open}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border text-foreground transition-colors duration-200 hover:border-accent hover:text-accent lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
        {/* Scroll progress hairline — black × gold official identity */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-gradient-to-r from-[#8a6d1b] via-[#d4af37] to-[#f9edb0]"
          style={{ transform: `scaleX(${progress})`, boxShadow: "0 0 14px rgba(212,175,55,0.65)" }}
        />
      </motion.header>

      {/* Sibling of the animated header: motion sets a CSS transform on the
          header, which would become the containing block for any `fixed`
          descendant — so the fullscreen menu must live outside it. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="royal-wayfinding glass fixed inset-0 z-40 lg:hidden"
          >
            <motion.ul
              initial="closed"
              animate="open"
              exit="closed"
              variants={{ open: { transition: { staggerChildren: 0.06 } }, closed: {} }}
              className="flex h-full flex-col gap-1 overflow-y-auto px-5 pt-32 pb-8 md:pt-40"
            >
              {navLinks.map((link, index) => {
                const isActive = active === link.id;
                return (
                  <motion.li
                    key={link.id}
                    variants={{
                      open: { opacity: 1, y: 0 },
                      closed: { opacity: 0, y: 14 },
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "flex items-center justify-between border-b border-border py-4 font-display text-[26px] font-semibold tracking-tight",
                        isActive ? "text-accent" : "text-foreground",
                      )}
                    >
                      {t.nav[link.id]}
                      <span className="font-mono text-xs font-normal text-faint">
                        0{index + 1}
                      </span>
                    </a>
                  </motion.li>
                );
              })}
              <motion.li
                variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: 14 } }}
                className="mt-auto pt-8"
              >
                <div className="mt-4 flex items-center justify-center">
                  <ControlCluster
                    onAction={() => setOpen(false)}
                    onSearch={() => {
                      setOpen(false);
                      setPaletteOpen(true);
                    }}
                  />
                </div>
                <p className="mt-4 text-center font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                  {t.hero.location} — {availLabel}
                </p>
                <p className="mt-1 text-center font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
                  {profile.email}
                </p>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUDI ⌘K command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Back-to-top — surfaces once you've travelled down the page */}
      <AnimatePresence>
        {progress > 0.12 && !open && (
          <motion.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={topLabel}
            title={topLabel}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="glass fixed right-5 bottom-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-accent/40 text-foreground shadow-[0_0_24px_rgba(255,61,0,0.25)] transition-colors duration-200 hover:text-accent sm:right-8 sm:bottom-8"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
