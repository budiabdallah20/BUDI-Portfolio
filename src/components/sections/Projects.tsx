"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { ArrowUpRight, Check, ChevronDown, ExternalLink, FolderGit, Heart, Link2, Plus, Search } from "lucide-react";
import CountUp from "@/components/CountUp";
import GlassModal from "@/components/GlassModal";
import { SponsoredBadge } from "@/components/Badges";
import { techLogo } from "@/data/techLogos";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabaseBrowser } from "@/lib/supabase/client";
import SmartImage from "@/components/SmartImage";
import type { AdminProject } from "@/components/admin/store";
import { siteLikesKey } from "@/components/admin/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "completed" | "in-progress" | "opensource";
type SortMode = "featured" | "loved" | "updated";

/** Grid page size — the featured showcase sits above and never counts. */
const PAGE_SIZE = 6;

/** Cover art per project — swap any file in public/images/projects/ to reskin. */
const COVERS: Record<string, string> = {
  kayan: "/images/projects/elearning.svg",
  massar: "/images/projects/analytics.svg",
  "budi-s-": "/images/projects/portfolio.svg",
};

/** Plain-language role of each technology — shown as tooltips on tech chips. */
const TECH_USAGE: Record<string, { en: string; fr: string }> = {
  React: { en: "Component system, hooks and client state", fr: "Composants, hooks et state client" },
  "Next.js": { en: "App Router, SSR and SEO", fr: "App Router, SSR et SEO" },
  "Node.js": { en: "REST APIs and business logic", fr: "API REST et logique métier" },
  Tailwind: { en: "Design system and responsive layout", fr: "Design system et layout responsive" },
  "Tailwind CSS": { en: "Design system and responsive layout", fr: "Design system et layout responsive" },
  PostgreSQL: { en: "Relational schema and queries", fr: "Schéma relationnel et requêtes" },
  "Vue.js": { en: "Reactive dashboards and views", fr: "Dashboards et vues réactives" },
  "D3.js": { en: "Custom charts and visualization", fr: "Graphiques et visualisation sur mesure" },
  Express: { en: "API layer and middleware", fr: "Couche API et middlewares" },
  MongoDB: { en: "Flexible document storage", fr: "Stockage document flexible" },
  Supabase: { en: "Auth, database and realtime", fr: "Auth, base et temps réel" },
  Stripe: { en: "Secure payment checkout", fr: "Paiement sécurisé" },
  "Three.js": { en: "3D scenes and effects", fr: "Scènes 3D et effets" },
  Motion: { en: "UI physics and transitions", fr: "Physique UI et transitions" },
  "Socket.io": { en: "Live updates and notifications", fr: "Temps réel et notifications" },
  Python: { en: "CLI core and automation", fr: "Cœur CLI et automatisation" },
  Click: { en: "Command parsing and help", fr: "Parsing des commandes et aide" },
  Git: { en: "Versioning and collaboration", fr: "Versioning et collaboration" },
  Docker: { en: "Reproducible environments", fr: "Environnements reproductibles" },
  TypeScript: { en: "Strict types end to end", fr: "Types stricts de bout en bout" },
};

interface ProjectExtra {
  demo: string | null;
  brief: { en: string[]; fr: string[] };
}

/** Live case-brief layer — real shipped projects, real demo links. */
const EXTRAS: Record<string, ProjectExtra> = {
  kayan: {
    demo: "https://budiabdallah20.github.io/kayan/",
    brief: {
      en: [
        "Bilingual study companion: AI assistant, Pomodoro focus sessions, flashcards and smart notes.",
        "Tasks, lectures, prayer times and performance analytics — a full student OS in one app.",
        "Result: live and used — open the demo, switch AR/EN, try a focus session.",
      ],
      fr: [
        "Compagnon d'étude bilingue : assistant IA, sessions Pomodoro, flashcards et notes intelligentes.",
        "Tâches, cours, prières et analyses — un OS étudiant complet dans une app.",
        "Résultat : en ligne et utilisé — ouvrez la démo, changez AR/EN, testez une session.",
      ],
    },
  },
  massar: {
    demo: "https://budiabdallah20.github.io/Massar/",
    brief: {
      en: [
        "Personal OS v10: kanban tasks, lecture attendance, expenses, habits and goals.",
        "Prayer tracker, tasbih, mood, memories, QR tools and Fofa the AI buddy — gamified with XP.",
        "Result: shipped at v10 — open the demo and explore a whole life system.",
      ],
      fr: [
        "OS personnel v10 : tâches kanban, présence aux cours, dépenses, habitudes et objectifs.",
        "Prières, tasbih, humeur, souvenirs, outils QR et Fofa l'ami IA — gamifié avec XP.",
        "Résultat : livré en v10 — ouvrez la démo et explorez tout un système de vie.",
      ],
    },
  },
  "budi-s-": {
    demo: "https://budi-six.vercel.app",
    brief: {
      en: [
        "My previous portfolio platform: contact hub, donation block and live status dashboards.",
        "Every section bilingual and animated — the ancestor of the site you are browsing now.",
        "Result: deployed on Vercel — open it and compare the journey.",
      ],
      fr: [
        "Mon ancienne plateforme portfolio : hub contact, bloc de dons et dashboards en direct.",
        "Chaque section bilingue et animée — l'ancêtre du site que vous visitez.",
        "Résultat : déployé sur Vercel — ouvrez-le et comparez le parcours.",
      ],
    },
  },
};

/** Visitor likes only — every count starts at zero, no seeded numbers. */

function loadLiked(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(siteLikesKey());
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") {
      const out: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v === true) out[k] = true;
      }
      return out;
    }
  } catch {
    /* storage blocked — likes stay session-only */
  }
  return {};
}

/**
 * Projects — one cinematic spotlight + a compact 3-per-row grid.
 * 10 or 100 projects: the spotlight wows, the grid scales with paging,
 * and every card still carries status, stack, meta, links and likes.
 */
export default function Projects({
  remote,
  remoteLikes,
  likesEnabled = true,
}: {
  remote?: AdminProject[];
  remoteLikes?: Record<string, number>;
  likesEnabled?: boolean;
}): React.JSX.Element {
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [liked, setLiked] = useState<Record<string, boolean>>(loadLiked);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [briefKey, setBriefKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fr = lang === "fr";

  /** Database wins when it has rows — dictionary is the fallback. Hidden (eye-off) rows never reach the site. */
  const list = useMemo(() => {
    if (remote && remote.length > 0) {
      return remote
        .filter((r) => r.visible !== false)
        .map((r) => ({
        title: r.title,
        desc: fr ? r.descFr || r.desc : r.desc,
        tech: r.tech,
        status: r.status,
        opensource: r.opensource,
        category: r.category,
        github: r.github,
        period: r.period || r.year,
        year: r.year,
        demo: r.demo || null,
        image: r.image || "",
        briefEn: r.briefEn,
        briefFr: r.briefFr,
        role: fr ? r.roleFr || r.roleEn : r.roleEn,
        timeline: fr ? r.timelineFr || r.timelineEn : r.timelineEn,
        sponsored: r.sponsored === true,
      }));
    }
    return t.projects.items.map((p) => ({ ...p, demo: null as string | null, image: "", briefEn: [] as string[], briefFr: [] as string[], role: "", timeline: "", sponsored: false as boolean }));
  }, [remote, fr, t]);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const detailItem = detailKey === null ? null : list.find((p) => (p.github || p.title) === detailKey) ?? null;
  const likeWord = fr ? "j'aime" : "likes";
  const likeAria = fr ? "Aimer ce projet" : "Like this project";
  const unlikeAria = fr ? "Retirer mon j'aime" : "Unlike this project";
  const copyAria = fr ? "Copier le lien du projet" : "Copy project link";
  const copiedAria = fr ? "Lien copié" : "Link copied";
  const sortFeatured = fr ? "En vedette" : "Featured";
  const sortLoved = fr ? "Les plus aimés" : "Most loved";
  const sortUpdated = fr ? "Récemment mis à jour" : "Recently updated";
  const stackWord = fr ? "Stack" : "Stack";
  const roleWord = fr ? "Rôle" : "Role";
  const timeWord = fr ? "Durée" : "Timeline";
  const briefWord = fr ? "Dossier projet" : "Case brief";
  const demoSoon = fr ? "Démo bientôt" : "Demo soon";
  const moreLabel = fr ? "Voir plus" : "Show more";
  const lessLabel = fr ? "Voir moins" : "Show less";
  const spotlightLabel = fr ? "À l'affiche" : "Spotlight";

  const statusLabel = (id: string): string =>
    t.projects.filters.find((f) => f.id === id)?.label ?? id;
  const openLabel =
    t.projects.filters.find((f) => f.id === "opensource")?.label ?? "Open Source";

  /** Real count = shared database total + this browser's own heart. */
  const likesOf = (key: string): number => (remoteLikes?.[key] ?? 0) + (liked[key] ? 1 : 0);

  const toggleLike = (key: string): void => {
    if (!likesEnabled) return;
    const loving = !liked[key];
    // Pure updater (StrictMode-safe) — persistence happens after, outside.
    setLiked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
    try {
      const current = loadLiked();
      if (current[key]) delete current[key];
      else current[key] = true;
      window.localStorage.setItem(siteLikesKey(), JSON.stringify(current));
    } catch {
      /* storage blocked — like still counts this session */
    }
    // Fire-and-forget shared counter (works offline: heart stays local).
    const rpc = loving ? "increment_like" : "decrement_like";
    void (async (): Promise<void> => {
      try {
        const res = await supabaseBrowser().rpc(rpc, { p_id: key });
        if (res.error) throw res.error;
      } catch {
        /* unreachable — local heart is the fallback */
      }
    })();
  };

  const copyLink = (key: string, slug: string): void => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#project-${slug}`;
      void navigator.clipboard?.writeText(url)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((cur) => (cur === key ? null : cur));
    }, 1600);
  };

  const allVisible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = list.filter((item) => {
      if (filter === "opensource" ? !item.opensource : filter !== "all" && item.status !== filter)
        return false;
      if (q === "") return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.tech.some((tech) => tech.toLowerCase().includes(q))
      );
    });
    if (sort === "loved") {
      return [...rows].sort(
        (a, b) => likesOf(b.github || b.title) - likesOf(a.github || a.title),
      );
    }
    if (sort === "updated") {
      const yearOf = (year: string): number => {
        const n = Number.parseInt(year, 10);
        return Number.isNaN(n) ? 0 : n;
      };
      return [...rows].sort((a, b) => yearOf(b.year) - yearOf(a.year));
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, filter, sort, liked, query]);

  /** Spotlight takes the first row when browsing the full gallery. */
  const showSpotlight = filter === "all" && query.trim() === "" && sort === "featured" && allVisible.length > 0;
  const spotlight = showSpotlight ? allVisible[0] : null;
  const rest = showSpotlight ? allVisible.slice(1) : allVisible;
  const visible = rest.slice(0, visibleCount);
  const hasMore = visibleCount < rest.length;

  const resetPage = (): void => {
    setVisibleCount(PAGE_SIZE);
    setBriefKey(null);
  };

  const stats = [
    { n: list.length, label: t.projects.stats.total },
    {
      n: list.filter((p) => p.status === "completed").length,
      label: t.projects.stats.done,
    },
    {
      n: list.filter((p) => p.status === "in-progress").length,
      label: t.projects.stats.progress,
    },
    {
      n: list.filter((p) => p.opensource).length,
      label: t.projects.stats.open,
    },
  ];

  const view = (props: object): object => (reduced ? {} : props);

  /** Cursor spotlight + gentle tilt — direct DOM writes, no re-renders. */
  const onCardMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${(event.clientX - rect.left).toFixed(0)}px`);
    el.style.setProperty("--sy", `${(event.clientY - rect.top).toFixed(0)}px`);
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${(-py * 2).toFixed(2)}deg) rotateY(${(px * 2.5).toFixed(2)}deg)`;
  };
  const onCardLeave = (event: React.MouseEvent<HTMLElement>): void => {
    event.currentTarget.style.transform = "";
  };

  const slugOf = (item: { github: string; title: string }, i: number): string =>
    (item.github.split("/").pop() || `p-${i}`).toLowerCase();
  const extraOf = (item: { github: string; title: string; demo: string | null; briefEn: string[]; briefFr: string[] }, slug: string): ProjectExtra | null => {
    const base = EXTRAS[slug];
    const remoteBrief = fr ? item.briefFr : item.briefEn;
    if (item.demo || remoteBrief.length > 0) {
      return {
        demo: item.demo ?? base?.demo ?? null,
        brief: {
          en: item.briefEn.length > 0 ? item.briefEn : (base?.brief.en ?? []),
          fr: item.briefFr.length > 0 ? item.briefFr : (base?.brief.fr ?? []),
        },
      };
    }
    return base ?? null;
  };

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="relative overflow-clip border-t border-border py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 15% 10%, rgba(255,61,0,0.07), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-16 right-0 hidden text-[20vw] leading-none opacity-20 select-none md:block"
      >
        03
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* ——— Header ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <p className="font-mono text-xs tracking-[0.35em] text-faint uppercase">
            {t.projects.eyebrow}
          </p>
          <h2
            id="projects-heading"
            className="display mt-4 text-4xl font-bold tracking-tight text-accent drop-shadow-[0_0_28px_rgba(255,61,0,0.25)] md:text-6xl xl:text-7xl"
          >
            {t.projects.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.projects.lede}
          </p>
        </motion.div>

        {/* ——— Counters ——— */}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 border-y border-border sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 px-4 py-6 text-center transition-colors duration-300 hover:bg-accent/[0.04]"
            >
              <CountUp
                end={s.n}
                className="display text-4xl font-bold text-foreground tabular-nums sm:text-5xl"
              />
              <span className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ——— Filters + sort ——— */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label={t.projects.title}
          >
            {t.projects.filters.map((f) => {
              const isActive = filter === f.id;
              const count =
                f.id === "all"
                  ? list.length
                  : f.id === "opensource"
                    ? list.filter((p) => p.opensource).length
                    : list.filter((p) => p.status === f.id).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setFilter(f.id); resetPage(); }}
                  aria-pressed={isActive}
                  className={cn(
                    "cursor-pointer border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-200",
                    isActive
                      ? "border-accent bg-accent font-bold text-accent-foreground"
                      : "border-border text-muted hover:border-accent/50 hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className="ml-2 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Sort">
              {(
                [
                  { id: "featured", label: sortFeatured },
                  { id: "loved", label: `${sortLoved} ♥` },
                  { id: "updated", label: sortUpdated },
                ] as const
              ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setSort(opt.id); resetPage(); }}
                aria-pressed={sort === opt.id}
                className={cn(
                  "cursor-pointer border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-all duration-200",
                  sort === opt.id
                    ? "border-accent/60 bg-accent/10 font-bold text-accent"
                    : "border-border text-faint hover:border-accent/40 hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ——— Search + count ——— */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <label className="flex w-full max-w-xl items-center gap-2 border border-border bg-surface/60 px-4 py-2.5 transition-colors focus-within:border-accent/60">
            <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            <span className="sr-only">{t.projects.searchPh}</span>
            <input
              type="text"
              value={query}
              onChange={(event) => { setQuery(event.target.value); resetPage(); }}
              placeholder={t.projects.searchPh}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
            />
          </label>
          <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase tabular-nums" role="status">
            {t.projects.showing} {allVisible.length}/{list.length}
          </p>
        </div>

        {/* ——— Spotlight: one cinematic showcase ——— */}
        {spotlight && (() => {
          const item = spotlight;
          const key = item.github || item.title;
          const slug = slugOf(item, 0);
          const isLoved = !!liked[key];
          const count = likesOf(key);
          const done = item.status === "completed";
          const extra = extraOf(item, slug);
          const briefOpen = briefKey === key;
          const cover = item.image || COVERS[slug];
          return (
            <motion.article
              key={`spotlight-${key}`}
              id={`project-${slug}`}
              initial={reduced ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              onMouseMove={onCardMove}
              onMouseLeave={onCardLeave}
              className="group relative mt-10 grid scroll-mt-28 overflow-hidden rounded-2xl border border-accent/25 bg-surface/60 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_24px_70px_-28px_rgba(215,253,68,0.35)] md:grid-cols-2"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(480px circle at var(--sx, 50%) var(--sy, 0%), rgba(215,253,68,0.08), transparent 65%)",
                }}
              />
              <div
                className="relative flex min-h-[240px] flex-col justify-between gap-6 overflow-hidden p-6 sm:p-8"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,61,0,0.14) 0%, rgba(255,61,0,0.03) 45%, transparent 70%), var(--surface)",
                }}
              >
                {cover && (
                  <SmartImage
                    src={cover as string}
                    alt=""
                    fill
                    fit="cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                />
                <div aria-hidden="true" className="bg-blueprint absolute inset-0 opacity-70" />
                <div className="relative flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/50 bg-accent px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-accent-foreground uppercase">
                    {spotlightLabel}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.18em] uppercase backdrop-blur-md",
                      done
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-amber-400/40 bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {!done && (
                      <span className="relative flex h-1.5 w-1.5">
                        {!reduced && (
                          <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-amber-400" />
                        )}
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </span>
                    )}
                    {statusLabel(item.status)}
                  </span>
                  {item.sponsored && <SponsoredBadge lang={lang} />}
                </div>
                <div className="relative">
                  <p className="font-mono text-[11px] tracking-[0.3em] text-white/70 uppercase">
                    {item.category} · {item.year}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetailKey(key)}
                    className="display mt-2 cursor-pointer text-left text-3xl font-bold tracking-tight text-white underline-offset-4 hover:underline sm:text-4xl"
                    aria-haspopup="dialog"
                  >
                    {item.title}
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {item.tech.slice(0, 5).map((tech) => {
                      const logo = techLogo(tech);
                      return (
                        <span
                          key={tech}
                          title={tech}
                          className="flex h-9 w-9 items-center justify-center border border-white/10 bg-black/40 backdrop-blur-md"
                        >
                          {logo ? (
                            <Image src={logo} alt="" width={20} height={20} loading="lazy" className="block h-5 w-5" />
                          ) : (
                            <span className="font-mono text-[10px] font-bold text-white">{tech.slice(0, 2).toUpperCase()}</span>
                          )}
                        </span>
                      );
                    })}
                    {item.tech.length > 5 && (
                      <span className="font-mono text-[11px] text-white/70 tabular-nums">+{item.tech.length - 5}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative flex flex-col justify-center p-6 sm:p-8">
                <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">{item.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tech.map((tech) => {
                    const mini = techLogo(tech);
                    const usage = TECH_USAGE[tech];
                    const tip = usage ? (fr ? usage.fr : usage.en) : tech;
                    return (
                      <span
                        key={tech}
                        title={`${tech} — ${tip}`}
                        className="flex cursor-help items-center gap-1.5 border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase transition-colors duration-200 hover:border-accent/60 hover:text-foreground"
                      >
                        {mini && <Image src={mini} alt="" width={12} height={12} loading="lazy" className="block h-3 w-3" />}
                        {tech}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
                  {extra?.demo ? (
                    <a
                      href={extra.demo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-accent px-5 py-2.5 text-[13px] font-bold text-accent-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-10px_var(--accent)]"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      {t.projects.demo}
                    </a>
                  ) : (
                    <span title={demoSoon} className="flex cursor-not-allowed items-center gap-2 border border-dashed border-border-strong px-5 py-2.5 text-[13px] font-bold text-faint">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      {demoSoon}
                    </span>
                  )}
                  <a
                    href={item.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-foreground px-5 py-2.5 text-[13px] font-bold text-background transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                  >
                    <FolderGit className="h-4 w-4" aria-hidden="true" />
                    {t.projects.code}
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleLike(key)}
                    disabled={!likesEnabled}
                    aria-pressed={isLoved}
                    aria-label={isLoved ? unlikeAria : likeAria}
                    className={cn(
                      "flex items-center gap-2 border px-4 py-2.5 text-[13px] font-bold transition-all duration-200",
                      likesEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                      isLoved
                        ? "border-accent bg-accent/15 text-accent shadow-[0_0_18px_rgba(255,61,0,0.35)]"
                        : "border-border text-muted hover:border-accent/60 hover:text-accent",
                    )}
                  >
                    <Heart className="h-4 w-4" fill={isLoved ? "currentColor" : "none"} aria-hidden="true" />
                    <span className="tabular-nums">{count}</span>
                    <span className="font-mono text-[10px] font-normal tracking-[0.14em] uppercase opacity-80">{likeWord}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyLink(key, slug)}
                    aria-label={copiedKey === key ? copiedAria : copyAria}
                    className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center border border-border text-muted transition-colors duration-200 hover:border-accent/60 hover:text-accent"
                  >
                    {copiedKey === key ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                  </button>
                  {extra && extra.brief[fr ? "fr" : "en"].length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBriefKey(briefOpen ? null : key)}
                      aria-expanded={briefOpen}
                      className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase transition-colors duration-200 hover:text-accent"
                    >
                      {briefWord}
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", briefOpen && "rotate-180")} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {extra && briefOpen && (
                    <motion.div
                      key="brief"
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                        {extra.brief[fr ? "fr" : "en"].map((point) => (
                          <li key={point.slice(0, 24)} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          );
        })()}

        {/* ——— Compact grid ——— */}
        {allVisible.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <p className="text-muted">{t.projects.noResults}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
                resetPage();
              }}
              className="border border-accent/50 px-5 py-2 text-sm font-bold text-accent transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              {t.projects.reset}
            </button>
          </div>
        ) : (
          <>
            <motion.div layout={reduced ? false : true} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((item, i) => {
                  const key = item.github || item.title;
                  const slug = slugOf(item, i);
                  const isLoved = !!liked[key];
                  const count = likesOf(key);
                  const done = item.status === "completed";
                  const extra = extraOf(item, slug);
                  const briefOpen = briefKey === key;
                  const cover = item.image || COVERS[slug];
                  return (
                    <motion.article
                      layout={reduced ? false : true}
                      key={key}
                      id={`project-${slug}`}
                      {...view({
                        initial: { opacity: 0, y: 24 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, scale: 0.98 },
                        transition: { duration: 0.35, ease: "easeOut" },
                      })}
                      onMouseMove={onCardMove}
                      onMouseLeave={onCardLeave}
                      className="group relative flex scroll-mt-28 flex-col overflow-hidden rounded-xl border border-border bg-surface/50 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_60px_-28px_rgba(215,253,68,0.35)]"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(420px circle at var(--sx, 50%) var(--sy, 0%), rgba(215,253,68,0.08), transparent 65%)",
                        }}
                      />
                      {/* Compact cover */}
                      <div
                        className="relative flex h-36 flex-col justify-between overflow-hidden p-3.5"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,61,0,0.14) 0%, rgba(255,61,0,0.03) 45%, transparent 70%), var(--surface)",
                        }}
                      >
                        {cover && (
                          <SmartImage
                            src={cover as string}
                            alt=""
                            fill
                            fit="cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div aria-hidden="true" className="bg-blueprint absolute inset-0 opacity-70" />
                        <span
                          aria-hidden="true"
                          className="display pointer-events-none absolute -right-1 -bottom-5 text-7xl leading-none font-black text-foreground/[0.10] select-none"
                        >
                          {item.title.charAt(0).toUpperCase()}
                        </span>
                        <div className="relative flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] tracking-[0.16em] uppercase backdrop-blur-md",
                              done
                                ? "border-accent/40 bg-accent/10 text-accent"
                                : "border-amber-400/40 bg-amber-400/10 text-amber-300",
                            )}
                          >
                            {!done && (
                              <span className="relative flex h-1.5 w-1.5">
                                {!reduced && (
                                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-amber-400" />
                                )}
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                              </span>
                            )}
                            {statusLabel(item.status)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {item.sponsored && <SponsoredBadge lang={lang} />}
                            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] text-white/70 uppercase backdrop-blur-md tabular-nums">
                              {item.year}
                            </span>
                          </span>
                        </div>
                        <div className="relative flex items-center gap-1.5">
                          {item.tech.slice(0, 5).map((tech) => {
                            const logo = techLogo(tech);
                            return (
                              <span key={tech} title={tech} className="flex h-7 w-7 items-center justify-center border border-white/10 bg-black/40 backdrop-blur-md">
                                {logo ? (
                                  <Image src={logo} alt="" width={16} height={16} loading="lazy" className="block h-4 w-4" />
                                ) : (
                                  <span className="font-mono text-[9px] font-bold text-white">{tech.slice(0, 2).toUpperCase()}</span>
                                )}
                              </span>
                            );
                          })}
                          {item.tech.length > 5 && (
                            <span className="font-mono text-[10px] text-white/70 tabular-nums">+{item.tech.length - 5}</span>
                          )}
                          {item.opensource && (
                            <span title={openLabel} className="ml-auto rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] text-accent uppercase backdrop-blur-md">
                              OSS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Compact body — whole title opens the glass dossier */}
                      <div className="relative flex flex-1 flex-col p-4">
                        <p className="font-mono text-[10px] tracking-[0.24em] text-faint uppercase">
                          {item.category} · {item.period}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDetailKey(key)}
                          aria-haspopup="dialog"
                          className="font-display mt-1.5 cursor-pointer truncate text-left text-lg font-bold tracking-tight text-foreground transition-colors hover:text-accent"
                        >
                          {item.title}
                        </button>
                        <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-muted">
                          {item.desc}
                        </p>
                        <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
                          {stackWord}: <span className="text-muted tabular-nums">{item.tech.length} tech</span>
                        </p>
                        {(item.role || item.timeline) && (
                          <dl className="mt-2 grid grid-cols-2 gap-1.5">
                            {item.role && (
                              <div className="rounded-lg border border-border bg-background/50 px-2.5 py-1.5">
                                <dt className="font-mono text-[8px] tracking-[0.2em] text-faint uppercase">{roleWord}</dt>
                                <dd className="truncate text-xs font-semibold text-foreground">{item.role}</dd>
                              </div>
                            )}
                            {item.timeline && (
                              <div className="rounded-lg border border-border bg-background/50 px-2.5 py-1.5">
                                <dt className="font-mono text-[8px] tracking-[0.2em] text-faint uppercase tabular-nums">{timeWord}</dt>
                                <dd className="truncate text-xs font-semibold text-foreground">{item.timeline}</dd>
                              </div>
                            )}
                          </dl>
                        )}

                        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
                          {extra?.demo ? (
                            <a
                              href={extra.demo}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${t.projects.demo} — ${item.title}`}
                              className="flex h-9 flex-1 items-center justify-center gap-1.5 bg-accent text-xs font-bold text-accent-foreground transition-all duration-200 hover:-translate-y-0.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.projects.demo}
                            </a>
                          ) : (
                            <span title={demoSoon} className="flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-1.5 border border-dashed border-border-strong text-xs font-bold text-faint">
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              {demoSoon}
                            </span>
                          )}
                          <a
                            href={item.github}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${t.projects.code} — ${item.title}`}
                            className="flex h-9 w-9 items-center justify-center bg-foreground text-background transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                          >
                            <FolderGit className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => toggleLike(key)}
                            disabled={!likesEnabled}
                            aria-pressed={isLoved}
                            aria-label={isLoved ? unlikeAria : likeAria}
                            className={cn(
                              "flex h-9 items-center gap-1.5 border px-2.5 text-xs font-bold transition-all duration-200",
                              likesEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                              isLoved
                                ? "border-accent bg-accent/15 text-accent shadow-[0_0_16px_rgba(255,61,0,0.35)]"
                                : "border-border text-muted hover:border-accent/60 hover:text-accent",
                            )}
                          >
                            <Heart className="h-3.5 w-3.5" fill={isLoved ? "currentColor" : "none"} aria-hidden="true" />
                            <span className="tabular-nums">{count}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyLink(key, slug)}
                            aria-label={copiedKey === key ? copiedAria : copyAria}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center border border-border text-muted transition-colors duration-200 hover:border-accent/60 hover:text-accent"
                          >
                            {copiedKey === key ? <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tech.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              title={`${tech} — ${(() => { const u = TECH_USAGE[tech]; return u ? (fr ? u.fr : u.en) : tech; })()}`}
                              className="cursor-help border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:border-accent/60 hover:text-foreground"
                            >
                              {tech}
                            </span>
                          ))}
                          {item.tech.length > 4 && (
                            <span className="font-mono text-[9px] text-faint tabular-nums">+{item.tech.length - 4}</span>
                          )}
                        </div>

                        {extra && extra.brief[fr ? "fr" : "en"].length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setBriefKey(briefOpen ? null : key)}
                              aria-expanded={briefOpen}
                              className="mt-2.5 flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-muted uppercase transition-colors duration-200 hover:text-accent"
                            >
                              {briefWord}
                              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", briefOpen && "rotate-180")} aria-hidden="true" />
                            </button>
                            <AnimatePresence initial={false}>
                              {briefOpen && (
                                <motion.ul
                                  key="brief"
                                  initial={reduced ? false : { height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={reduced ? undefined : { height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="mt-2 space-y-1.5 overflow-hidden border-t border-border pt-2.5"
                                >
                                  {extra.brief[fr ? "fr" : "en"].map((point) => (
                                    <li key={point.slice(0, 24)} className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground">
                                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                                      {point}
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase tabular-nums" role="status">
                {t.projects.showing} {visible.length}/{rest.length}{showSpotlight ? ` + 1 ${spotlightLabel}` : ""}
              </p>
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="group inline-flex cursor-pointer items-center gap-2 border border-accent/50 px-7 py-3 text-sm font-bold text-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" aria-hidden="true" />
                  {moreLabel} ({rest.length - visible.length})
                </button>
              ) : (
                rest.length > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(PAGE_SIZE)}
                    className="cursor-pointer border border-border px-6 py-2.5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase transition-colors duration-200 hover:border-accent/50 hover:text-foreground"
                  >
                    {lessLabel}
                  </button>
                )
              )}
            </div>
          </>
        )}

        {/* ——— CTA ——— */}
        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 bg-accent px-7 py-3.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-12px_var(--accent)]"
          >
            {t.projects.cta}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      {/* Glass dossier — full project file: cover + meta + stack + repo + demo + brief */}
      <GlassModal
        open={detailItem !== null}
        onClose={() => setDetailKey(null)}
        label={detailItem?.title ?? "Project details"}
        accent="#ff3d00"
        wide
      >
        {detailItem !== null &&
          (() => {
            const dKey = detailItem.github || detailItem.title;
            const dSlug = (detailItem.github.split("/").pop() || "p").toLowerCase();
            const dExtra = extraOf(
              {
                github: detailItem.github,
                title: detailItem.title,
                demo: detailItem.demo,
                briefEn: detailItem.briefEn,
                briefFr: detailItem.briefFr,
              },
              dSlug,
            );
            const dLiked = !!liked[dKey];
            const dCount = likesOf(dKey);
            const dCover = detailItem.image || COVERS[dSlug];
            const dIdx = list.findIndex((p) => (p.github || p.title) === dKey);
            const dPrev = dIdx > 0 ? list[dIdx - 1] : null;
            const dNext = dIdx >= 0 && dIdx < list.length - 1 ? list[dIdx + 1] : null;
            const done = detailItem.status === "completed";
            return (
              <div>
                {dCover !== undefined && dCover !== "" && (
                  <span className="relative mb-5 block aspect-[16/8] w-full overflow-hidden rounded-2xl border border-white/10">
                    <SmartImage src={dCover} alt="" fill fit="cover" sizes="(max-width: 768px) 100vw, 700px" className="object-cover" />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={
                          done
                            ? "rounded-full border border-accent/50 bg-accent px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-accent-foreground uppercase"
                            : "rounded-full border border-amber-400/50 bg-amber-400 px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-black uppercase"
                        }
                      >
                        {statusLabel(detailItem.status)}
                      </span>
                      {detailItem.opensource && (
                        <span className="rounded-full border border-accent/40 bg-black/55 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-accent uppercase backdrop-blur-md">
                          OSS
                        </span>
                      )}
                    </span>
                    <span className="absolute right-3 bottom-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-white/85 uppercase backdrop-blur-md tabular-nums">
                      {detailItem.year} · {detailItem.period}
                    </span>
                  </span>
                )}
                <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">
                  {detailItem.category} · {detailItem.year} · {detailItem.period}
                  {detailItem.sponsored && <SponsoredBadge lang={lang} />}
                </p>
                <h3 className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">
                  {detailItem.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{detailItem.desc}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {detailItem.role !== "" && (
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <dt className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{roleWord}</dt>
                      <dd className="truncate text-sm font-bold text-white" title={detailItem.role}>{detailItem.role}</dd>
                    </div>
                  )}
                  {detailItem.timeline !== "" && (
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <dt className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{timeWord}</dt>
                      <dd className="truncate text-sm font-bold text-white tabular-nums" title={detailItem.timeline}>{detailItem.timeline}</dd>
                    </div>
                  )}
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <dt className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{stackWord}</dt>
                    <dd className="text-sm font-bold text-white tabular-nums">{detailItem.tech.length} tech</dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <dt className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{fr ? "Statut" : "Status"}</dt>
                    <dd className="text-sm font-bold text-white">{statusLabel(detailItem.status)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {detailItem.tech.map((tech) => {
                    const logo = techLogo(tech);
                    const usage = TECH_USAGE[tech];
                    const tip = usage ? (fr ? usage.fr : usage.en) : tech;
                    return (
                      <span
                        key={tech}
                        title={`${tech} — ${tip}`}
                        className="flex cursor-help items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase"
                      >
                        {logo && <Image src={logo} alt="" width={12} height={12} loading="lazy" className="block h-3 w-3" />}
                        {tech}
                      </span>
                    );
                  })}
                </div>
                {dExtra && dExtra.brief[fr ? "fr" : "en"].length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <li className="font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase">{briefWord}</li>
                    {dExtra.brief[fr ? "fr" : "en"].map((point) => (
                      <li key={point.slice(0, 24)} className="flex items-start gap-2 text-sm text-white/85">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Repo box — full URL + copy + open */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl">
                  <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.22em] text-white/40 uppercase">
                    <FolderGit className="h-3.5 w-3.5" aria-hidden="true" />
                    Repo · GitHub
                  </p>
                  <p className="mt-1.5 truncate font-mono text-xs text-white/60" dir="ltr" title={detailItem.github}>{detailItem.github}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <a
                      href={detailItem.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <FolderGit className="h-4 w-4" aria-hidden="true" />
                      {t.projects.code}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(dKey, dSlug)}
                      className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-xl border border-white/15 text-white/60 transition-colors hover:border-accent/60 hover:text-accent"
                      aria-label={copiedKey === dKey ? copiedAria : copyAria}
                    >
                      {copiedKey === dKey ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                {/* Demo box — full URL + open */}
                <div className="mt-2.5 rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl">
                  <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.22em] text-white/40 uppercase">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Live demo
                  </p>
                  {dExtra?.demo ? (
                    <>
                      <p className="mt-1.5 truncate font-mono text-xs text-white/60" dir="ltr" title={dExtra.demo}>{dExtra.demo}</p>
                      <a
                        href={dExtra.demo}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t.projects.demo}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 border border-dashed border-white/20 px-4 py-2.5 text-[13px] font-bold text-white/40">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      {demoSoon}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleLike(dKey)}
                    disabled={!likesEnabled}
                    aria-pressed={dLiked}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-bold",
                      dLiked ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-white/60",
                    )}
                  >
                    <Heart className="h-4 w-4" fill={dLiked ? "currentColor" : "none"} aria-hidden="true" />
                    <span className="tabular-nums">{dCount}</span>
                  </button>
                  <span className="ms-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!dPrev}
                      onClick={() => dPrev && setDetailKey(dPrev.github || dPrev.title)}
                      className="flex cursor-pointer items-center gap-1 rounded-xl border border-white/15 px-3.5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-white/60 uppercase transition-colors hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← {fr ? "Préc" : "Prev"}
                    </button>
                    <button
                      type="button"
                      disabled={!dNext}
                      onClick={() => dNext && setDetailKey(dNext.github || dNext.title)}
                      className="flex cursor-pointer items-center gap-1 rounded-xl border border-white/15 px-3.5 py-2.5 font-mono text-[11px] tracking-[0.14em] text-white/60 uppercase transition-colors hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {fr ? "Suiv" : "Next"} →
                    </button>
                  </span>
                </div>
                <p className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
                  BUDI · {detailItem.year} · {fr ? "Signé" : "Signed"}
                </p>
              </div>
            );
          })()}
      </GlassModal>
    </section>
  );
}
