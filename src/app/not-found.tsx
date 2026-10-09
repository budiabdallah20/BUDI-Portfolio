"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * 404 — bilingual via lang check (route-level, no dictionary dependency).
 */
export default function NotFound(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy =
    lang === "fr"
      ? {
          title: "Page introuvable",
          desc: "Cette adresse n'existe pas encore — le portfolio est toujours en construction.",
          back: "Retour d'accueil",
        }
      : {
          title: "Page not found",
          desc: "This route doesn't exist yet — the portfolio is still under construction.",
          back: "Back home",
        };
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-faint uppercase">404</p>
      <h1 className="display text-4xl font-bold sm:text-5xl">{copy.title}</h1>
      <p className="max-w-md text-muted">{copy.desc}</p>
      <a
        href="/"
        className="mt-2 bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
      >
        {copy.back}
      </a>
    </main>
  );
}
