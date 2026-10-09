"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Briefcase, Check, Copy, Crown, Flame, FolderGit, Heart, LayoutGrid, Plus, Search, Sprout, Star } from "lucide-react";
import GlassModal from "@/components/GlassModal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AdminProject, AdminSkill } from "@/components/admin/store";
import { readSkillLiked, skillLikesKey } from "@/components/admin/store";
import { libIcon } from "@/lib/brandIcons";
import SmartImage from "@/components/SmartImage";
import { skillProjectUsage } from "@/lib/skill-usage";
import { cn } from "@/lib/utils";

type Category = "all" | "frontend" | "backend" | "tools";
type ProofKey = "daily" | "portfolio" | "client" | "learning";
type LevelKey = "expert" | "advanced" | "intermediate";

interface Skill {
  name: string;
  cat: Exclude<Category, "all">;
  level: number;
  levelKey: LevelKey;
  proof: ProofKey;
  logo: string;
  /** Library icon key — renders instead of the logo when set. */
  icon?: string;
  detail: { en: string; fr: string };
}

/** Page size for the dense grid — 100+ skills stay one click away. */
const PAGE_SIZE = 12;

/** Visitor skill-likes — every heart starts at zero, stored per browser. */
const loadSkillLiked = readSkillLiked;

/** Mastery tiers — color-coded so an HR scans seniority in one glance. */
const LEVEL_META: Record<LevelKey, { bg: string; fg: string; glow: string }> = {
  expert: { bg: "#d7fd44", fg: "#101200", glow: "0 0 16px rgba(215,253,68,0.45)" },
  advanced: { bg: "#38bdf8", fg: "#082f49", glow: "0 0 16px rgba(56,189,248,0.45)" },
  intermediate: { bg: "#fbbf24", fg: "#451a03", glow: "0 0 16px rgba(251,191,36,0.45)" },
};

const PROOF_ICONS: Record<ProofKey, typeof Flame> = {
  daily: Flame,
  portfolio: LayoutGrid,
  client: Briefcase,
  learning: Sprout,
};

/** Site source of truth — the admin dashboard seeds from this (do not duplicate). */
export const SKILLS: Skill[] = [
  { name: "React", cat: "frontend", level: 92, levelKey: "expert", proof: "daily", logo: "/icons/tech/react.svg", detail: { en: "Component architecture, hooks and state done right.", fr: "Architecture composants, hooks et state maîtrisés." } },
  { name: "Next.js", cat: "frontend", level: 90, levelKey: "expert", proof: "portfolio", logo: "/icons/tech/nextjs.svg", detail: { en: "App Router, SSR and SEO-friendly builds.", fr: "App Router, SSR et builds SEO-friendly." } },
  { name: "TypeScript", cat: "frontend", level: 86, levelKey: "expert", proof: "daily", logo: "/icons/tech/typescript.svg", detail: { en: "Strict types from API to UI.", fr: "Types stricts, de l'API à l'UI." } },
  { name: "JavaScript", cat: "frontend", level: 88, levelKey: "expert", proof: "daily", logo: "/icons/tech/javascript.svg", detail: { en: "Modern ES, async patterns, clean logic.", fr: "ES moderne, async et logique propre." } },
  { name: "Tailwind CSS", cat: "frontend", level: 90, levelKey: "expert", proof: "portfolio", logo: "/icons/tech/tailwind.svg", detail: { en: "Design systems at utility speed.", fr: "Design systems à vitesse utilitaire." } },
  { name: "HTML", cat: "frontend", level: 95, levelKey: "expert", proof: "daily", logo: "/icons/tech/html.svg", detail: { en: "Semantic, accessible markup.", fr: "Markup sémantique et accessible." } },
  { name: "CSS", cat: "frontend", level: 90, levelKey: "expert", proof: "daily", logo: "/icons/tech/css.svg", detail: { en: "Layouts, animations and polish.", fr: "Layouts, animations et finition." } },
  { name: "GSAP", cat: "frontend", level: 76, levelKey: "advanced", proof: "portfolio", logo: "/icons/tech/gsap.svg", detail: { en: "Scroll choreography that wows.", fr: "Chorégraphies scroll qui impressionnent." } },
  { name: "Framer Motion", cat: "frontend", level: 78, levelKey: "advanced", proof: "portfolio", logo: "/icons/tech/framer.svg", detail: { en: "Buttery UI physics and gestures.", fr: "Physique UI fluide et gestes." } },
  { name: "Node.js", cat: "backend", level: 72, levelKey: "advanced", proof: "client", logo: "/icons/tech/nodejs.svg", detail: { en: "APIs and tooling behind the scenes.", fr: "API et outillage en coulisses." } },
  { name: "Git & GitHub", cat: "tools", level: 84, levelKey: "advanced", proof: "daily", logo: "/icons/tech/git.svg", detail: { en: "Clean history, reviews, CI basics.", fr: "Historique propre, reviews et CI." } },
  { name: "Figma", cat: "tools", level: 68, levelKey: "intermediate", proof: "learning", logo: "/icons/tech/figma.svg", detail: { en: "From mockup to pixel-faithful code.", fr: "De la maquette au code fidèle." } },
];

const COPY = {
  en: {
    eyebrow: "04 · Skills",
    title: "My Skills",
    lede: "Technologies I ship with — ranked by mastery, proven in real work.",
    tabs: { all: "All", frontend: "Frontend", backend: "Backend", tools: "Tools & Design" },
    search: "Filter skills…",
    empty: "No skill matches that filter.",
    sortAZ: "A–Z",
    copyStack: "Copy stack",
    copied: "Copied",
    skillsWord: "skills",
    proofs: {
      daily: "Daily driver",
      portfolio: "Powers this portfolio",
      client: "Client projects",
      learning: "Leveling up",
    },
    proofLabel: "Proof",
    seeWork: "See it in projects",
    spotlightTitle: "Now leveling up",
    spotlightSub: "Sharpening right now — hire the trajectory, not just the snapshot.",
    levels: { expert: "Expert", advanced: "Advanced", intermediate: "Intermediate" },
    levelLabel: "Mastery",
    topTitle: "Most mastered",
    topSub: "The sharpest tools in the box",
    barsLabel: "Mastery meter",
    more: "Show more",
    less: "Show less",
    showing: "Showing",
    like: "Like this skill",
    unlike: "Unlike this skill",
    likesWord: "likes",
  },
  fr: {
    eyebrow: "04 · Compétences",
    title: "Mes compétences",
    lede: "Les technologies avec lesquelles je livre — classées par maîtrise, prouvées en production.",
    tabs: { all: "Tout", frontend: "Frontend", backend: "Backend", tools: "Outils & Design" },
    search: "Filtrer…",
    empty: "Aucune compétence ne correspond.",
    sortAZ: "A–Z",
    copyStack: "Copier la stack",
    copied: "Copié",
    skillsWord: "compétences",
    proofs: {
      daily: "Usage quotidien",
      portfolio: "Propulse ce portfolio",
      client: "Projets clients",
      learning: "En progression",
    },
    proofLabel: "Preuve",
    seeWork: "Voir dans les projets",
    spotlightTitle: "En progression",
    spotlightSub: "En train de se perfectionner — misez sur la trajectoire.",
    levels: { expert: "Expert", advanced: "Avancé", intermediate: "Intermédiaire" },
    levelLabel: "Maîtrise",
    topTitle: "Les mieux maîtrisés",
    topSub: "Les outils les plus affûtés",
    barsLabel: "Niveau de maîtrise",
    more: "Voir plus",
    less: "Voir moins",
    showing: "Affichage",
    like: "Aimer cette compétence",
    unlike: "Ne plus aimer",
    likesWord: "j'aime",
  },
} as const;

/**
 * Skills — dense mastery grid built for 100+ entries:
 * compact tiles (logo + name + meter + proof) with live search,
 * top-3 headline, learning spotlight and paged reveal.
 */
export default function Skills({
  remote,
  projects,
}: {
  remote?: AdminSkill[];
  projects?: AdminProject[];
}): React.JSX.Element {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [sortAZ, setSortAZ] = useState(false);
  const [stackCopied, setStackCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [skillLiked, setSkillLiked] = useState<Record<string, boolean>>(loadSkillLiked);
  const [detailName, setDetailName] = useState<string | null>(null);
  const t = lang === "fr" ? COPY.fr : COPY.en;

  /** Database wins when it has rows — SKILLS constant is the fallback. Hidden (eye-off) rows never reach the site. */
  const list: Skill[] = useMemo(() => {
    if (remote && remote.length > 0) {
      return remote
        .filter((r) => r.visible !== false)
        .map((r) => ({
        name: r.name,
        cat: r.cat,
        level: r.level,
        levelKey: (r.level >= 85 ? "expert" : r.level >= 70 ? "advanced" : "intermediate") as LevelKey,
        proof: r.proof,
        logo: r.logo,
        icon: r.icon || "",
        detail: { en: r.detailEn, fr: r.detailFr },
      }));
    }
    return SKILLS;
  }, [remote]);

  const tabs = (Object.keys(t.tabs) as Category[]).map((key) => ({
    key,
    label: t.tabs[key],
    count: key === "all" ? list.length : list.filter((s) => s.cat === key).length,
  }));

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = list.filter(
      (s) =>
        (tab === "all" || s.cat === tab) && (q === "" || s.name.toLowerCase().includes(q)),
    );
    return [...rows].sort((a, b) =>
      sortAZ ? a.name.localeCompare(b.name) : b.level - a.level,
    );
  }, [list, tab, query, sortAZ]);

  const filtered = filteredAll.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAll.length;

  const summary = useMemo(() => {
    const count = (key: ProofKey): number => list.filter((s) => s.proof === key).length;
    return [
      { n: list.length, label: t.skillsWord },
      { n: count("daily"), label: t.proofs.daily },
      { n: count("portfolio"), label: t.proofs.portfolio },
    ];
  }, [list, t]);

  const learning = list.filter((s) => s.levelKey === "intermediate");

  /** Top-3 sharpest tools — the HR headline strip. */
  const topThree = useMemo(() => [...list].sort((a, b) => b.level - a.level).slice(0, 3), [list]);

  /** Live proof: every skill knows how many projects actually use it + its showcase score. */
  const usageByName = useMemo(() => {
    const refs = (projects ?? []).map((p) => ({ title: p.title, tech: p.tech, visible: p.visible }));
    const map: Record<string, { count: number; projects: string[]; score: number }> = {};
    for (const s of list) map[s.name] = skillProjectUsage(s.name, s.level, refs);
    return map;
  }, [list, projects]);

  /** 5-segment mastery meter — visual scan, no raw percentages. */
  const segments = (level: number): boolean[] =>
    Array.from({ length: 5 }, (_, i) => i < Math.round(level / 20));

  const toggleSkillLike = (name: string): void => {
    // Pure updater (StrictMode-safe) — persistence happens after, outside.
    setSkillLiked((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = true;
      return next;
    });
    try {
      const current = readSkillLiked();
      if (current[name]) delete current[name];
      else current[name] = true;
      window.localStorage.setItem(skillLikesKey(), JSON.stringify(current));
    } catch {
      /* storage blocked — heart still counts this session */
    }
  };

  const copyStack = (): void => {
    const text = list.map((s) => s.name).join(", ");
    try {
      void navigator.clipboard?.writeText(text)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setStackCopied(true);
    window.setTimeout(() => setStackCopied(false), 1600);
  };

  const resetPage = (): void => setVisibleCount(PAGE_SIZE);

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="relative overflow-clip border-t border-border"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(255,61,0,0.07), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-16 right-0 hidden text-[20vw] leading-none opacity-20 select-none md:block"
      >
        04
      </div>
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-aurora-a absolute top-[12%] left-[2%] h-[280px] w-[280px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(215,253,68,0.06) 0%, transparent 65%)" }}
          />
          <div
            aria-hidden="true"
            className="animate-aurora-b absolute right-[2%] bottom-[8%] h-[260px] w-[260px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 65%)" }}
          />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="flex items-center gap-4 font-mono text-xs tracking-[0.35em] text-faint uppercase">
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60"
            />
            {t.eyebrow}
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60"
            />
          </p>
          <h2
            id="skills-heading"
            className="display mt-4 text-4xl font-bold tracking-tight text-accent drop-shadow-[0_0_28px_rgba(255,61,0,0.25)] md:text-6xl xl:text-7xl"
          >
            {t.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.lede}
          </p>
        </div>

        {/* Tabs + search */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div
            role="tablist"
            aria-label={t.title}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => { setTab(item.key); resetPage(); }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-all duration-200",
                  tab === item.key
                    ? "border-accent bg-accent font-bold text-accent-foreground shadow-[0_0_20px_rgba(255,61,0,0.4)]"
                    : "border-border text-muted hover:border-accent/50 hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    tab === item.key ? "bg-black/20" : "bg-white/5 text-faint",
                  )}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex w-full max-w-2xl flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 border border-border bg-surface/60 px-4 py-2.5 transition-colors focus-within:border-accent/60">
              <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
              <span className="sr-only">{t.search}</span>
              <input
                type="text"
                value={query}
                onChange={(event) => { setQuery(event.target.value); resetPage(); }}
                placeholder={t.search}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
              />
            </label>
            <div
              role="group"
              aria-label="Sort"
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => { setSortAZ((v) => !v); resetPage(); }}
                aria-pressed={sortAZ}
                className={cn(
                  "cursor-pointer border px-3 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-all duration-200",
                  sortAZ
                    ? "border-accent bg-accent font-bold text-accent-foreground"
                    : "border-border text-muted hover:border-accent/50 hover:text-foreground",
                )}
              >
                {t.sortAZ}
              </button>
              <button
                type="button"
                onClick={copyStack}
                title={t.copyStack}
                className="flex cursor-pointer items-center gap-1.5 border border-border px-3 py-2.5 font-mono text-[10px] tracking-[0.18em] text-muted uppercase transition-all duration-200 hover:border-accent/50 hover:text-accent"
              >
                {stackCopied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {stackCopied ? t.copied : t.copyStack}
              </button>
            </div>
          </div>
          {/* Summary strip */}
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.2em] text-faint uppercase">
            {summary.map((item, i) => (
              <span key={item.label} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                )}
                <span>
                  <span className="font-bold text-accent tabular-nums">{item.n}</span>{" "}
                  {item.label}
                </span>
              </span>
            ))}
          </p>
          <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase tabular-nums" role="status">
            {t.showing} {filtered.length}/{filteredAll.length}
          </p>
        </div>

        {/* Most mastered — the HR headline */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.08] via-surface/70 to-[#38bdf8]/[0.07] px-5 py-5">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
              <Crown className="h-4 w-4" aria-hidden="true" />
              {t.topTitle}
            </p>
            <p className="font-display text-lg font-bold text-foreground sm:text-xl">
              {t.topSub}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {topThree.map((s, i) => {
              const meta = LEVEL_META[s.levelKey];
              return (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 transition-colors duration-300 hover:border-accent/50"
                >
                  <span
                    className="display text-xl font-bold tabular-nums"
                    style={{ color: meta.bg, textShadow: meta.glow }}
                  >
                    {i + 1}
                  </span>
                  {(() => {
                    const Lib = libIcon(s.icon);
                    if (Lib) return <Lib className="block h-7 w-7" aria-hidden="true" />;
                    return <SmartImage src={s.logo} alt="" width={28} height={28} className="block h-7 w-7" />;
                  })()}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{s.name}</p>
                    <p
                      className="font-mono text-[10px] tracking-[0.18em] uppercase tabular-nums"
                      style={{ color: meta.bg }}
                    >
                      {s.level}/100 · {t.levels[s.levelKey]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning spotlight */}
        {learning.length > 0 && (
          <div className="relative mt-4 flex flex-col items-center gap-2.5 overflow-hidden rounded-2xl border border-dashed border-accent/40 bg-accent/[0.05] px-5 py-4 text-center">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
            />
            <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
              <span className="relative flex h-2 w-2">
                {!reduced && (
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-accent" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {t.spotlightTitle}
            </p>
            <p className="max-w-lg text-[13px] leading-relaxed text-muted">{t.spotlightSub}</p>
            <p className="flex flex-wrap items-center justify-center gap-1.5">
              {learning.slice(0, 8).map((s) => (
                <a
                  key={s.name}
                  href="#contact"
                  title={s.name}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-semibold text-foreground transition-all duration-200 hover:border-accent/60 hover:text-accent"
                >
                  {(() => {
                    const Lib = libIcon(s.icon);
                    if (Lib) return <Lib className="block h-3.5 w-3.5" aria-hidden="true" />;
                    return <SmartImage src={s.logo} alt="" width={14} height={14} className="block h-3.5 w-3.5" />;
                  })()}
                  {s.name}
                </a>
              ))}
              {learning.length > 8 && (
                <span className="font-mono text-[10px] text-faint tabular-nums">+{learning.length - 8}</span>
              )}
            </p>
          </div>
        )}

        {/* Dense compact tiles — 4 per row on xl, made for 100+ */}
        {filteredAll.length === 0 ? (
          <p className="mt-10 text-center text-sm text-faint">{t.empty}</p>
        ) : (
          <>
            <motion.div layout className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((skill) => {
                  const meta = LEVEL_META[skill.levelKey];
                  const ProofIcon = PROOF_ICONS[skill.proof];
                  const segs = segments(skill.level);
                  return (
                  <motion.article
                    layout
                    key={skill.name}
                    initial={reduced ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_16px_44px_-20px_var(--accent)]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 z-10 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                      style={{ background: `linear-gradient(to right, ${meta.bg}, transparent)`, boxShadow: meta.glow }}
                    />
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white/[0.04]">
                        <span
                          aria-hidden="true"
                          className="absolute h-8 w-8 rounded-full bg-accent/15 blur-xl transition-all duration-500 group-hover:bg-accent/25"
                        />
                        {(() => {
                          const Lib = libIcon(skill.icon);
                          if (Lib) {
                            return <Lib className="relative block h-[26px] w-[26px] transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />;
                          }
                          return <SmartImage src={skill.logo} alt="" fill fit="contain" sizes="26px" className="block h-[26px] w-[26px] transition-transform duration-300 group-hover:scale-110" />;
                        })()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setDetailName(skill.name)}
                          aria-haspopup="dialog"
                          className="truncate font-display cursor-pointer text-left text-[15px] font-bold text-foreground transition-colors hover:text-accent"
                        >
                          {skill.name}
                        </button>
                        <p className="font-mono text-[9px] tracking-[0.18em] text-faint uppercase">
                          {t.tabs[skill.cat]}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <span className="font-mono text-xs font-bold tabular-nums" style={{ color: meta.bg }}>
                          {skill.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSkillLike(skill.name)}
                          aria-pressed={!!skillLiked[skill.name]}
                          aria-label={skillLiked[skill.name] ? t.unlike : t.like}
                          title={skillLiked[skill.name] ? t.unlike : t.like}
                          className={cn(
                            "flex cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] tabular-nums transition-all duration-200",
                            skillLiked[skill.name]
                              ? "border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,61,0,0.35)]"
                              : "border-border text-faint hover:border-accent/60 hover:text-accent",
                          )}
                        >
                          <Heart
                            className="h-2.5 w-2.5"
                            fill={skillLiked[skill.name] ? "currentColor" : "none"}
                            aria-hidden="true"
                          />
                          {skillLiked[skill.name] ? 1 : 0}
                        </button>
                      </div>
                    </div>
                    {/* Mastery meter — 5 segments, screen-reader friendly */}
                    <div
                      role="img"
                      aria-label={`${t.barsLabel}: ${skill.level} / 100 — ${t.levels[skill.levelKey]}`}
                      className="mt-2.5 flex items-center gap-1"
                    >
                      {segs.map((on, i) => (
                        <span
                          key={i}
                          aria-hidden="true"
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={
                            on
                              ? { backgroundColor: meta.bg, boxShadow: meta.glow }
                              : { backgroundColor: "rgba(244,244,239,0.12)" }
                          }
                        />
                      ))}
                      <span
                        className="ml-1.5 rounded-full border px-1.5 py-px font-mono text-[8px] font-bold tracking-[0.12em] uppercase"
                        style={{
                          borderColor: `${meta.bg}70`,
                          backgroundColor: `${meta.bg}1f`,
                          color: meta.bg,
                        }}
                      >
                        {t.levels[skill.levelKey]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-[2.5em] text-[13px] leading-snug text-muted">
                      {lang === "fr" ? skill.detail.fr : skill.detail.en}
                    </p>
                    {(() => {
                      const usage = usageByName[skill.name];
                      if (!usage) return null;
                      return (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            title={(usage.projects ?? []).join(" · ") || (lang === "fr" ? "Aucun projet lié" : "No linked project yet")}
                            className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/[0.07] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.08em] text-accent uppercase"
                          >
                            <FolderGit className="h-3 w-3" aria-hidden="true" />
                            {lang === "fr" ? `× ${usage.count} projets` : `× ${usage.count} projects`}
                          </span>
                          <span
                            title={lang === "fr" ? "Score vitrine = maîtrise + preuve projets" : "Showcase score = mastery + project proof"}
                            className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.08em] text-foreground uppercase tabular-nums"
                          >
                            <Star className="h-3 w-3 text-[#d7fd44]" aria-hidden="true" />
                            {usage.score}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                      <span
                        title={`${t.proofLabel}: ${t.proofs[skill.proof]}`}
                        className="flex min-w-0 items-center gap-1 rounded-full border border-border bg-background/50 px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted uppercase"
                      >
                        <ProofIcon className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
                        <span className="truncate">{t.proofs[skill.proof]}</span>
                      </span>
                      <a
                        href="#projects"
                        aria-label={`${t.seeWork} — ${skill.name}`}
                        className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted transition-colors duration-200 hover:text-accent"
                      >
                        {t.seeWork}
                        <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </div>
                  </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="group inline-flex cursor-pointer items-center gap-2 border border-accent/50 px-7 py-3 text-sm font-bold text-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" aria-hidden="true" />
                  {t.more} ({filteredAll.length - filtered.length})
                </button>
              ) : (
                filteredAll.length > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={resetPage}
                    className="cursor-pointer border border-border px-6 py-2.5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase transition-colors duration-200 hover:border-accent/50 hover:text-foreground"
                  >
                    {t.less}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Glass dossier — same language as the certificates lightbox */}
      <GlassModal
        open={detailName !== null}
        onClose={() => setDetailName(null)}
        label={detailName ?? "Skill details"}
        accent="#d7fd44"
      >
        {detailName !== null &&
          (() => {
            const s = list.find((x) => x.name === detailName);
            if (!s) return null;
            const meta = LEVEL_META[s.levelKey];
            const ProofIcon = PROOF_ICONS[s.proof];
            const usage = usageByName[s.name];
            const Lib = libIcon(s.icon);
            return (
              <div className="text-center">
                <span
                  className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border"
                  style={{ borderColor: `${meta.bg}66`, backgroundColor: `${meta.bg}14`, boxShadow: meta.glow }}
                >
                  {Lib ? (
                    <Lib className="block h-10 w-10" aria-hidden="true" />
                  ) : (
                    <SmartImage src={s.logo} alt="" width={40} height={40} className="block h-10 w-10" />
                  )}
                </span>
                <h3 className="font-display mt-4 text-2xl font-black text-white">{s.name}</h3>
                <p className="mt-1 font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">
                  {t.tabs[s.cat]} · {s.level}/100 · {t.levels[s.levelKey]}
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
                  {lang === "fr" ? s.detail.fr || s.detail.en : s.detail.en}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase">
                  <ProofIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t.proofs[s.proof]}
                </p>
                {usage && (
                  <p className="mt-2 font-mono text-[11px] text-white/50 tabular-nums">
                    × {usage.count} {lang === "fr" ? "projets" : "projects"} · ★ {usage.score}
                  </p>
                )}
                <div className="mt-5 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSkillLike(s.name)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold",
                      skillLiked[s.name] ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-white/60",
                    )}
                  >
                    <Heart className="h-4 w-4" fill={skillLiked[s.name] ? "currentColor" : "none"} aria-hidden="true" />
                    {skillLiked[s.name] ? 1 : 0}
                  </button>
                  <a
                    href="#projects"
                    onClick={() => setDetailName(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                  >
                    {t.seeWork}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })()}
      </GlassModal>
    </section>
  );
}
