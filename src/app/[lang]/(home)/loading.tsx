"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

/** Route-level fallback — light paper curtain, black mark (new identity). */
export default function RouteLoading(): React.JSX.Element {
  const { lang } = useLanguage();
  return (
    <div
      role="status"
      aria-label={lang === "fr" ? "Chargement de la page" : "Loading page"}
      className="flex min-h-svh items-center justify-center overflow-hidden bg-[#faf9f6]"
    >
      <svg
        width="132"
        height="132"
        viewBox="0 0 240 240"
        aria-hidden="true"
        className="block h-28 w-28 animate-pulse sm:h-32 sm:w-32"
      >
        <g stroke="#0A0A0A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M120 14 L214 69 L120 124 L26 69 Z" />
          <path d="M26 69 L26 170 L120 225 L120 124" />
          <path d="M214 69 L214 170 L120 225" />
          <path d="M120 41.5 L167 69 L120 96.5 L73 69 Z" />
          <path d="M73 96.5 L73 197.5" />
          <path d="M167 96.5 L167 197.5" />
          <path d="M26 119.5 L120 174.5 L214 119.5" />
        </g>
      </svg>
    </div>
  );
}
