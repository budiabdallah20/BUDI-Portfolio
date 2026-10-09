"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface ErrorPageProps {
  reset: () => void;
}

/**
 * Route error — bilingual via lang check (route-level, no dictionary dependency).
 */
export default function ErrorPage({ reset }: ErrorPageProps): React.JSX.Element {
  const { lang } = useLanguage();
  const copy =
    lang === "fr"
      ? { eyebrow: "Erreur", title: "Quelque chose a mal tourné", retry: "Réessayer" }
      : { eyebrow: "Error", title: "Something went wrong", retry: "Try again" };
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-faint uppercase">{copy.eyebrow}</p>
      <h1 className="display text-4xl font-bold sm:text-5xl">{copy.title}</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-2 cursor-pointer bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
      >
        {copy.retry}
      </button>
    </main>
  );
}
