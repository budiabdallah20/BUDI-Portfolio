"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "./store";

export interface ServiceSuggestion {
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  tags: string[];
  points: string[];
  pointsFr: string[];
  bestForEn: string;
  bestForFr: string;
  timelineEn: string;
  timelineFr: string;
}

const SUGGESTIONS: Record<ServiceCategory, ServiceSuggestion[]> = {
  development: [
    {
      title: "Full-Stack Web Development",
      titleFr: "Développement Web Full-Stack",
      desc: "Complete web apps from database to deploy — React, Next.js and TypeScript in one coherent build.",
      descFr: "Des applications web complètes, de la base de données au déploiement — React, Next.js et TypeScript dans un build cohérent.",
      tags: ["Next.js", "TypeScript", "Node.js"],
      points: ["End-to-end product builds", "Auth, dashboards & roles", "Deploy pipelines included"],
      pointsFr: ["Produits complets de bout en bout", "Auth, dashboards et rôles", "Pipelines de déploiement inclus"],
      bestForEn: "Startups & SaaS founders",
      bestForFr: "Startups & fondateurs SaaS",
      timelineEn: "1–4 weeks · weekly demos",
      timelineFr: "1–4 semaines · démos hebdo",
    },
    {
      title: "CRM Systems",
      titleFr: "Systèmes CRM",
      desc: "Customer pipelines under control — leads, follow-ups and reports in one place.",
      descFr: "Des pipelines clients sous contrôle — prospects, relances et rapports au même endroit.",
      tags: ["Pipelines", "Leads", "Reports"],
      points: ["Lead pipelines", "Follow-up flows", "Sales reports"],
      pointsFr: ["Pipelines de prospects", "Relances", "Rapports de vente"],
      bestForEn: "Sales teams & agencies",
      bestForFr: "Équipes commerciales & agences",
      timelineEn: "1–3 weeks · data import included",
      timelineFr: "1–3 semaines · import de données inclus",
    },
  ],
  design: [
    {
      title: "Front-End UI/UX Crafting",
      titleFr: "Craft UI/UX Front-End",
      desc: "Pixel-faithful, animated interfaces — Tailwind precision with motion that feels alive.",
      descFr: "Des interfaces fidèles au pixel et animées — la précision Tailwind avec du mouvement vivant.",
      tags: ["Tailwind CSS", "GSAP", "Motion"],
      points: ["Design-to-code fidelity", "Micro-interactions", "Reusable component systems"],
      pointsFr: ["Fidélité maquette-to-code", "Micro-interactions", "Systèmes de composants réutilisables"],
      bestForEn: "Brands & landing pages",
      bestForFr: "Marques & landing pages",
      timelineEn: "3–10 days · 2 revision rounds",
      timelineFr: "3–10 jours · 2 allers-retours",
    },
  ],
  backend: [
    {
      title: "Back-End & API Architecture",
      titleFr: "Architecture Back-End & API",
      desc: "Secure, typed REST APIs with clean contracts — auth, validation and errors done right.",
      descFr: "Des API REST sécurisées et typées aux contrats clairs — auth, validation et erreurs bien gérées.",
      tags: ["Node.js", "REST", "Auth"],
      points: ["REST resource design", "Auth & access roles", "Validation & error shaping"],
      pointsFr: ["Conception REST", "Auth et rôles d'accès", "Validation et erreurs"],
      bestForEn: "Dashboards & platforms",
      bestForFr: "Dashboards & plateformes",
      timelineEn: "1–3 weeks · API docs included",
      timelineFr: "1–3 semaines · docs API incluses",
    },
    {
      title: "Database Modeling",
      titleFr: "Modélisation Base de Données",
      desc: "Schemas that scale — relations, indexes and migrations planned before the first row.",
      descFr: "Des schémas qui passent l'échelle — relations, index et migrations pensés avant la première ligne.",
      tags: ["SQL", "Indexing", "Migrations"],
      points: ["Relational schema design", "Index strategy", "Safe migrations"],
      pointsFr: ["Schémas relationnels", "Stratégie d'index", "Migrations sûres"],
      bestForEn: "Data-heavy products",
      bestForFr: "Produits data-heavy",
      timelineEn: "3–7 days · diagram included",
      timelineFr: "3–7 jours · schéma inclus",
    },
  ],
  growth: [
    {
      title: "Performance & SEO",
      titleFr: "Performance & SEO",
      desc: "Core Web Vitals in the green and pages Google loves — metadata, OG cards and sitemaps.",
      descFr: "Des Core Web Vitals au vert et des pages que Google adore — métadonnées, cartes OG et sitemaps.",
      tags: ["Vitals", "Metadata", "Sitemaps"],
      points: ["Vitals 90+ on mobile", "Meta + OG/social cards", "Sitemaps & robots"],
      pointsFr: ["Vitals 90+ sur mobile", "Meta + cartes OG", "Sitemaps & robots"],
      bestForEn: "Launches & SEO pushes",
      bestForFr: "Lancements & SEO",
      timelineEn: "1–2 weeks · measurable wins",
      timelineFr: "1–2 semaines · gains mesurables",
    },
  ],
};

/**
 * Suggested copy — one tap fills an empty service form with a proven
 * EN+FR preset for its category. Filled fields are never overwritten
 * unless "overwrite" is on.
 */
export default function SuggestCopy({
  category,
  isEmpty,
  onApply,
  accent = "#d7fd44",
}: {
  category: ServiceCategory;
  isEmpty: boolean;
  onApply: (s: ServiceSuggestion) => void;
  accent?: string;
}): React.JSX.Element {
  const [done, setDone] = useState(false);
  const presets = SUGGESTIONS[category] ?? SUGGESTIONS.development;
  const preset = presets[0]!;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          onApply(preset);
          setDone(true);
          window.setTimeout(() => setDone(false), 2200);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all hover:-translate-y-0.5",
          done
            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
            : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/40 hover:text-white",
        )}
        style={done ? undefined : { borderColor: `${accent}55`, color: accent }}
        title={isEmpty ? "Fill empty fields with suggested copy" : "Fill remaining empty fields with suggested copy"}
      >
        {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
        {done ? "✓ Suggested applied" : `Suggest copy — ${category}`}
      </button>
      <p className="font-mono text-[9px] tracking-[0.1em] text-white/35 uppercase">
        {preset.title} · EN+FR ready
      </p>
    </div>
  );
}
