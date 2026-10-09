"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Download, Languages, Mail, Search } from "lucide-react";
import { heroCopy, navLinks, profile } from "@/data/portfolio";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteItem {
  key: string;
  label: string;
  hint: string;
  icon: "go" | "lang" | "mail" | "cv";
  run: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps): React.JSX.Element {
  const { t, lang, toggle } = useLanguage();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const goTo = (href: string) => (): void => {
      onClose();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    };
    return [
      ...navLinks.map((link, i) => ({
        key: `go-${link.id}`,
        label: t.nav[link.id],
        hint: `0${i + 1}`,
        icon: "go" as const,
        run: goTo(link.href),
      })),
      {
        key: "lang",
        label: lang === "en" ? t.controls.switchToFrench : t.controls.switchToEnglish,
        hint: lang === "en" ? "FR" : "EN",
        icon: "lang" as const,
        run: (): void => {
          toggle();
          onClose();
        },
      },
      {
        key: "mail",
        label: copied ? t.hero.card.copied : t.hero.card.copyEmail,
        hint: "✉",
        icon: "mail" as const,
        run: (): void => {
          try {
            void navigator.clipboard?.writeText(profile.email);
          } catch {
            /* clipboard unavailable — address is still shown */
          }
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        },
      },
      {
        key: "cv",
        label: t.hero.downloadCv,
        hint: "PDF",
        icon: "cv" as const,
        run: (): void => {
          onClose();
          const a = document.createElement("a");
          a.href = heroCopy.tertiaryCta.href;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
      },
    ];
  }, [t, lang, toggle, onClose, copied]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => (filtered.length === 0 ? 0 : (c + 1) % filtered.length));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => (filtered.length === 0 ? 0 : (c - 1 + filtered.length) % filtered.length));
      }
      if (event.key === "Enter") filtered[cursor]?.run();
    };
    document.addEventListener("keydown", onKey);
    return (): void => {
      window.clearTimeout(timer);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, filtered, cursor]);

  const icons = { go: ArrowUpRight, lang: Languages, mail: Mail, cv: Download } as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[18vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg overflow-hidden border border-border"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                placeholder={lang === "fr" ? "Taper une commande…" : "Type a command…"}
                aria-label={lang === "fr" ? "Recherche rapide" : "Quick search"}
                className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
              />
              <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
                ESC
              </kbd>
            </div>
            <ul className="max-h-[40vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-xs tracking-[0.2em] text-faint uppercase">
                  —
                </li>
              )}
              {filtered.map((item, i) => {
                const Icon = icons[item.icon];
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={item.run}
                      onMouseMove={() => setCursor(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150",
                        i === cursor ? "bg-accent/10 text-foreground" : "text-muted",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      <span className="font-mono text-[10px] tracking-[0.15em] text-faint uppercase">
                        {item.hint}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
