"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { NavId } from "@/i18n/dictionaries";

interface SectionShellProps {
  id: string;
  index: string;
  navId: NavId;
}

/**
 * Phase scaffold — reserves the anchor, spacing rhythm and reveal slot for
 * its future section. Real content lands here in upcoming phases.
 */
export default function SectionShell({ id, index, navId }: SectionShellProps): React.JSX.Element {
  const { t, lang } = useLanguage();
  return (
    <section
      id={id}
      aria-label={t.nav[navId]}
      className="relative flex min-h-[60vh] scroll-mt-24 items-center justify-center border-t border-border"
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <span className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
          {index} — {t.nav[navId]}
        </span>
        <span className="border border-dashed border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          {lang === "fr" ? "Bientôt" : "Coming soon"}
        </span>
      </div>
    </section>
  );
}
