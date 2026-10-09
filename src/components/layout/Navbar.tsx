"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowUpRight, Menu, MessageCircle, Search, X } from "lucide-react";
import { navLinks, profile } from "@/data/portfolio";
import { workDeadlineSuffix, workLabel, type SiteAvailability } from "@/components/WorkStatus";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/utils";
import CommandPalette from "./CommandPalette";
import LangFlag from "./LangFlag";
import Logo from "@/components/Logo";
import UtilityBar from "./UtilityBar";

interface NavbarProps {
  visible: boolean;
  availability?: SiteAvailability;
}

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
  const { lang, t, toggle } = useLanguage();
  const actionLabel = lang === "en" ? t.controls.switchToFrench : t.controls.switchToEnglish;
  return (
    <button
      type="button"
      onClick={() => {
        toggle();
        onToggle?.();
      }}
      aria-label={actionLabel}
      title={actionLabel}
      className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:text-foreground"
    >
      <LangFlag lang={lang} />
      <span aria-hidden="true">{lang.toUpperCase()}</span>
    </button>
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
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
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
  const hireLabel = lang === "fr" ? "Embauchez-moi" : "Hire me";

  useEffect(() => {
    const onScroll = (): void => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      // Smart hide — glides away scrolling down, returns on the way up.
      // State flips only on direction change, never every frame.
      const prev = lastY.current;
      if (y > prev + 6 && y > 180 && !open) setHidden(true);
      else if (y < prev - 6 || y < 180) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return (): void => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [open ]);

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return (): void => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;
  const shown = visible && !hidden;

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
            className={cn(
              "group flex items-center gap-3 rounded-xl transition-all duration-300",
              solid && "drop-shadow-[0_0_14px_rgba(255,61,0,0.35)]",
            )}
            aria-label="BUDI — back to home"
          >
            <Logo />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold tracking-tight">BUDI</span>
              <span className="font-mono text-[9px] tracking-[0.3em] text-faint uppercase">
                Folio — 26
              </span>
            </span>
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
                      "group relative block rounded-full px-3.5 py-2 text-[15px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-accent/10 text-foreground shadow-[0_0_20px_rgba(255,61,0,0.28)]"
                        : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <RollText label={t.nav[link.id]} rollClassName="text-accent" />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-4 -bottom-px h-0.5 origin-left rounded-full bg-accent shadow-[0_0_8px_rgba(255,61,0,0.8)] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 left-1 h-1 w-1 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,61,0,0.9)]"
                      />
                    )}
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
            <a
              href="#contact"
              className="group flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-accent-foreground shadow-[0_10px_30px_-12px_var(--accent)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_var(--accent)]"
            >
              {hireLabel}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </a>
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
        {/* Scroll progress hairline — ember into lime as you travel the page */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-gradient-to-r from-accent via-[#ff8a3d] to-[#d7fd44]"
          style={{ transform: `scaleX(${progress})`, boxShadow: "0 0 14px rgba(255,61,0,0.65)" }}
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
            className="glass fixed inset-0 z-40 lg:hidden"
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
                <div className="flex gap-2.5">
                  <a
                    href="#contact"
                    onClick={() => setOpen(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-3.5 text-sm font-black text-accent-foreground shadow-[0_14px_40px_-14px_var(--accent)]"
                  >
                    {hireLabel}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href="https://wa.me/201065228072"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="flex w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-[#062d1a] shadow-[0_14px_40px_-14px_rgba(37,211,102,0.9)]"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
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
