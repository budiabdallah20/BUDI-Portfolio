"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

/** Route-level fallback — black luxury identity, giant drawn B. */
export default function RouteLoading(): React.JSX.Element {
  const { lang } = useLanguage();
  return (
    <div
      role="status"
      aria-label={lang === "fr" ? "Chargement de la page" : "Loading page"}
      className="flex min-h-svh items-center justify-center overflow-hidden bg-[#010402]"
    >
      <div className="flex flex-col items-center text-center">
        <svg
          width="192"
          height="192"
          viewBox="0 0 200 200"
          aria-hidden="true"
          className="block h-44 w-44 sm:h-48 sm:w-48"
          style={{ filter: "drop-shadow(0 0 26px rgba(34,197,94,0.32))" }}
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(238,244,230,0.14)"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
          <path
            d="M68 52 H102 C120 52 128 64 128 78 C128 90 120 98 108 100 C122 102 132 112 132 128 C132 146 120 156 100 156 H68 Z"
            fill="transparent"
            stroke="#eaf3df"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="load-luxe-b"
          />
        </svg>
        <span
          aria-hidden="true"
          className="mt-5 block h-px w-28 bg-gradient-to-r from-transparent via-[#d7fd44]/70 to-transparent"
        />
      </div>
    </div>
  );
}
