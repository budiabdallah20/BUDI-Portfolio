import type { Lang } from "@/i18n/dictionaries";

/**
 * Crisp inline-SVG flags — no image assets, correct at any size/DPR.
 * EN uses the UK flag (locale is en-GB), FR uses the French tricolour.
 */
export default function LangFlag({ lang }: { lang: Lang }): React.JSX.Element {
  if (lang === "fr") {
    return (
      <svg
        width="20"
        height="14"
        viewBox="0 0 3 2"
        role="presentation"
        aria-hidden="true"
        className="flag"
      >
        <rect width="1" height="2" x="0" fill="#0055A4" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#EF4135" />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="14"
      viewBox="0 0 60 30"
      role="presentation"
      aria-hidden="true"
      className="flag"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
