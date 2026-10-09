"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  ArrowUpRight,
  Boxes,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Database,
  Gauge,
  Globe,
  Link2,
  MessagesSquare,
  MessageCircle,
  Palette,
  Plus,
  RefreshCcw,
  Search,
  Server,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TECH_STACK, techLogo } from "@/data/techLogos";
import { libIcon } from "@/lib/brandIcons";
import SmartImage from "@/components/SmartImage";
import GlassModal from "@/components/GlassModal";
import type { ServiceCategory } from "@/i18n/dictionaries";
import type { AdminService } from "@/components/admin/store";
import { cn } from "@/lib/utils";

const ICONS = [
  Globe,
  Palette,
  Server,
  Database,
  Gauge,
  Wrench,
  Boxes,
  Sparkles,
  Users,
  Workflow,
] as const;

/** How many cards render per page — scales to 100+ without a endless scroll. */
const PAGE_SIZE = 6;

/** Signature color per craft — icon tiles, washes, glows and ignite bars. */
const CAT_COLORS: Record<
  ServiceCategory,
  { bg: string; fg: string; wash: string; glow: string; soft: string }
> = {
  development: {
    bg: "#ff3d00",
    fg: "#1a0e05",
    wash: "linear-gradient(135deg, rgba(255,61,0,0.16) 0%, rgba(255,61,0,0.04) 42%, transparent 68%)",
    glow: "0 18px 50px -22px rgba(255,61,0,0.55)",
    soft: "rgba(255,61,0,0.10)",
  },
  design: {
    bg: "#38bdf8",
    fg: "#082f49",
    wash: "linear-gradient(135deg, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0.04) 42%, transparent 68%)",
    glow: "0 18px 50px -22px rgba(56,189,248,0.55)",
    soft: "rgba(56,189,248,0.10)",
  },
  backend: {
    bg: "#a78bfa",
    fg: "#2e1065",
    wash: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(167,139,250,0.05) 42%, transparent 68%)",
    glow: "0 18px 50px -22px rgba(167,139,250,0.55)",
    soft: "rgba(167,139,250,0.12)",
  },
  growth: {
    bg: "#fbbf24",
    fg: "#451a03",
    wash: "linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.04) 42%, transparent 68%)",
    glow: "0 18px 50px -22px rgba(251,191,36,0.55)",
    soft: "rgba(251,191,36,0.10)",
  },
};

/** HR-grade engagement facts per craft — who it's for + how it ships. */
const CAT_META: Record<
  ServiceCategory,
  { bestFor: { en: string; fr: string }; timeline: { en: string; fr: string } }
> = {
  development: {
    bestFor: { en: "Startups & SaaS founders", fr: "Startups & fondateurs SaaS" },
    timeline: { en: "1–4 weeks · weekly demos", fr: "1–4 semaines · démos hebdo" },
  },
  design: {
    bestFor: { en: "Brands & landing pages", fr: "Marques & landing pages" },
    timeline: { en: "3–10 days · 2 revision rounds", fr: "3–10 jours · 2 allers-retours" },
  },
  backend: {
    bestFor: { en: "Dashboards & platforms", fr: "Dashboards & plateformes" },
    timeline: { en: "1–3 weeks · API docs included", fr: "1–3 semaines · docs API incluses" },
  },
  growth: {
    bestFor: { en: "Launches & SEO pushes", fr: "Lancements & SEO" },
    timeline: { en: "1–2 weeks · measurable wins", fr: "1–2 semaines · gains mesurables" },
  },
};

const ASSURANCES = [
  { icon: Clock, en: "Reply within 24h", fr: "Réponse sous 24h" },
  { icon: RefreshCcw, en: "2 revision rounds included", fr: "2 allers-retours inclus" },
  { icon: MessagesSquare, en: "Clear async updates", fr: "Suivi async clair" },
] as const;

type Filter = ServiceCategory | "all";

/** View row — database rows mapped per language, dictionary shape otherwise. */
interface ServiceView {
  title: string;
  desc: string;
  tags: string[];
  points: string[];
  category: ServiceCategory;
  bestFor: string;
  timeline: string;
  icon: string;
  iconImage: string;
}

export default function Services({ remote }: { remote?: AdminService[] }): React.JSX.Element {
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detailTitle, setDetailTitle] = useState<string | null>(null);
  const fr = lang === "fr";

  const moreLabel = fr ? "Voir plus" : "Show more";
  const lessLabel = fr ? "Voir moins" : "Show less";
  const showingLabel = fr ? "Affichage" : "Showing";
  const proofLabel = fr ? "Voir la preuve" : "See proof";
  const copyAria = fr ? "Copier le lien du service" : "Copy service link";
  const copiedAria = fr ? "Lien copié" : "Link copied";

  const slugOf = (title: string): string =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "service";

  const copyLink = (slug: string): void => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#service-${slug}`;
      void navigator.clipboard?.writeText(url)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopiedKey(slug);
    window.setTimeout(() => {
      setCopiedKey((cur) => (cur === slug ? null : cur));
    }, 1600);
  };

  /** Database wins when it has rows — baked-in dictionary is the fallback. Hidden (eye-off) rows never reach the site. */
  const source: ServiceView[] = useMemo(() => {
    if (remote && remote.length > 0) {
      return remote
        .filter((r) => r.visible !== false)
        .map((r) => ({
        title: fr ? r.titleFr || r.title : r.title,
        desc: fr ? r.descFr || r.desc : r.desc,
        tags: r.tags,
        points: fr && r.pointsFr.length > 0 ? r.pointsFr : r.points,
        category: r.category,
        bestFor: fr ? r.bestForFr : r.bestForEn,
        timeline: fr ? r.timelineFr : r.timelineEn,
        icon: r.icon || "",
        iconImage: r.iconImage || "",
      }));
    }
    return t.services.items.map((item) => {
      const meta = CAT_META[item.category];
      return {
        title: item.title,
        desc: item.desc,
        tags: item.tags,
        points: item.points,
        category: item.category,
        bestFor: fr ? meta.bestFor.fr : meta.bestFor.en,
        timeline: fr ? meta.timeline.fr : meta.timeline.en,
        icon: "",
        iconImage: "",
      };
    });
  }, [remote, fr, t]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      source.filter(
        (item) =>
          (filter === "all" || item.category === filter) &&
          (q === "" ||
            item.title.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))),
      ),
    [source, filter, q],
  );
  const items = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const deliverables = source.reduce((n, s) => n + s.points.length, 0);
  /** One-tap order — the client lands in WhatsApp with the service pre-written. */
  const orderHref = (title: string): string =>
    `https://wa.me/201065228072?text=${encodeURIComponent(
      fr ? `Bonjour BUDI ! Je veux : ${title}` : `Hi BUDI! I want: ${title}`,
    )}`;

  /** Cursor spotlight per card — direct CSS-var writes, no re-renders. */
  const onSpotMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${(event.clientX - rect.left).toFixed(0)}px`);
    el.style.setProperty("--sy", `${(event.clientY - rect.top).toFixed(0)}px`);
  };

  /** Subtle pointer tilt — transform only, fine pointers only. */
  const onTiltMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 3).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
  };
  const onTiltLeave = (event: React.MouseEvent<HTMLElement>): void => {
    event.currentTarget.style.transform = "";
  };

  const view = (visible: object): object => (reduced ? {} : visible);

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative overflow-clip border-t border-border py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 85% 10%, rgba(255,61,0,0.06), transparent 65%)",
        }}
      />
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-drift-a absolute top-[20%] left-[4%] h-[300px] w-[300px] rounded-full will-transform"
            style={{ background: "radial-gradient(circle, rgba(215,253,68,0.07) 0%, transparent 65%)" }}
          />
          <div
            aria-hidden="true"
            className="animate-drift-b absolute right-[6%] bottom-[10%] h-[260px] w-[260px] rounded-full will-transform"
            style={{ background: "radial-gradient(circle, rgba(255,61,0,0.07) 0%, transparent 65%)" }}
          />
        </>
      )}

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
            {t.services.eyebrow}
          </p>
          <h2
            id="services-heading"
            className="display mt-4 text-4xl font-bold tracking-tight text-accent md:text-6xl xl:text-7xl"
          >
            {t.services.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.services.lede}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2" role="status">
            {[
              { n: source.length, l: fr ? "services" : "services" },
              { n: t.services.filters.length - 1, l: fr ? "savoir-faire" : "crafts" },
              { n: deliverables, l: fr ? "livrables" : "deliverables" },
            ].map((s) => (
              <span
                key={s.l}
                className="flex items-baseline gap-1.5 rounded-full border border-border bg-surface/60 px-4 py-1.5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase backdrop-blur-md"
              >
                <span className="text-sm font-black text-accent tabular-nums">{s.n}</span>
                {s.l}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ——— Search + filters ——— */}
        <div className="mx-auto mt-10 flex w-full max-w-2xl flex-col items-center gap-3">
          <label className="flex w-full items-center gap-2.5 rounded-full border border-border bg-surface/60 px-5 py-3 backdrop-blur-md transition-colors focus-within:border-accent/60">
            <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            <span className="sr-only">{fr ? "Rechercher un service" : "Search services"}</span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={fr ? "Rechercher un service, un outil…" : "Search services, tools…"}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={fr ? "Effacer" : "Clear"}
                className="cursor-pointer text-faint transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t.services.title}>
            {t.services.filters.map((f) => {
              const isActive = filter === f.id;
              const count =
                f.id === "all"
                  ? source.length
                  : source.filter((s) => s.category === f.id).length;
              const dot = f.id === "all" ? "#d7fd44" : (CAT_COLORS[f.id as ServiceCategory]?.bg ?? "#d7fd44");
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilter(f.id);
                    setOpenIndex(null);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-200 hover:-translate-y-0.5",
                    isActive
                      ? "border-accent bg-accent font-bold text-accent-foreground shadow-[0_10px_30px_-12px_var(--accent)]"
                      : "border-border bg-surface/50 text-muted hover:border-accent/50 hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isActive ? "currentColor" : dot }} aria-hidden="true" />
                  {f.label}
                  <span className={cn("rounded-full px-1.5 tabular-nums", isActive ? "bg-black/20" : "bg-white/5 text-faint")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] tracking-[0.2em] text-faint uppercase tabular-nums" role="status">
          {showingLabel} {items.length}/{filtered.length}
        </p>
        {filtered.length === 0 && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            {fr ? "Aucun service ne correspond — essayez un autre mot." : "No service matches — try another word."}
          </p>
        )}

        {/* ——— Compact cards: 3-per-row, built for 100+ ——— */}
        <motion.div layout={reduced ? false : true} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item, i) => {
              const globalIndex = source.indexOf(item);
              const Icon = ICONS[globalIndex % ICONS.length] ?? Globe;
              const CustomIcon = libIcon(item.icon);
              const cat = CAT_COLORS[item.category];
              const expanded = openIndex === globalIndex;
              const panelId = `service-panel-${globalIndex}`;
              const visibleTags = item.tags.slice(0, 5);
              const extraTags = item.tags.length - visibleTags.length;
              const slug = slugOf(item.title);
              return (
                <motion.article
                  layout={reduced ? false : true}
                  key={item.title}
                  id={`service-${slug}`}
                  {...view({
                    initial: { opacity: 0, y: 24 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.97 },
                    transition: { duration: 0.35, ease: "easeOut", delay: Math.min(i % PAGE_SIZE, 6) * 0.04 },
                  })}
                  onMouseMove={(e) => {
                    onSpotMove(e);
                    onTiltMove(e);
                  }}
                  style={{ "--cat": cat.bg } as React.CSSProperties}
                  className={cn(
                    "group relative flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border bg-surface/70 p-6 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5",
                    expanded ? "border-accent/60 shadow-[0_24px_70px_-28px_var(--accent)]" : "hover:border-accent/40",
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = cat.glow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                    onTiltLeave(e);
                  }}
                >
                  {/* Craft wash + spotlight + ignite bar + ghost number */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: cat.wash }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(360px circle at var(--sx, 50%) var(--sy, 0%), rgba(255,61,0,0.09), transparent 65%)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-[3px] w-0 bg-[linear-gradient(to_right,var(--cat),transparent)] transition-all duration-500 group-hover:w-full"
                  />
                  <span
                    aria-hidden="true"
                    className="display pointer-events-none absolute -top-2 right-3 text-6xl font-black select-none"
                    style={{ color: `${cat.bg}14`, textShadow: `0 0 40px ${cat.bg}22` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex items-start gap-3.5">
                    <span
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                      style={{
                        backgroundColor: cat.bg,
                        color: cat.fg,
                        boxShadow: `0 0 26px ${cat.bg}66`,
                      }}
                    >
                      {item.iconImage ? (
                        <span className="relative block h-full w-full p-1">
                          <SmartImage src={item.iconImage} alt="" fill fit="contain" sizes="48px" />
                        </span>
                      ) : CustomIcon ? (
                        <CustomIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      )}
                      {!reduced && i === 0 && (
                        <span className="animate-ping-soft absolute inset-0 rounded-xl border-2" style={{ borderColor: `${cat.bg}88` }} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase">
                        <span
                          className="rounded-full border px-2 py-0.5"
                          style={{
                            borderColor: `${cat.bg}80`,
                            backgroundColor: cat.soft,
                            color: cat.bg,
                          }}
                        >
                          {t.services.filters.find((f) => f.id === item.category)?.label}
                        </span>
                        <span className="text-faint tabular-nums">
                          {item.points.length} ✓
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setDetailTitle(item.title)}
                        aria-haspopup="dialog"
                        className="font-display mt-1.5 cursor-pointer text-left text-xl leading-snug font-bold tracking-tight text-foreground transition-colors hover:text-accent"
                      >
                        {item.title}
                      </button>
                    </div>
                  </div>

                  <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    {item.desc}
                  </p>

                  {/* First wins preview — the card sells before expanding */}
                  <ul className="relative mt-3 space-y-1.5">
                    {item.points.slice(0, 2).map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-foreground/85">
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: cat.soft }}
                        >
                          <Check className="h-3 w-3" style={{ color: cat.bg }} aria-hidden="true" />
                        </span>
                        <span className="line-clamp-1">{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                    {visibleTags.map((tag) => {
                      const logo = techLogo(tag);
                      return logo ? (
                        <a
                          key={tag}
                          href="#skills"
                          title={`${tag} — mastery in Skills`}
                          aria-label={`${tag} — mastery in Skills`}
                          className="flex h-7 w-7 items-center justify-center border border-border bg-white/[0.05] transition-all duration-300 hover:scale-110 hover:border-accent/60"
                        >
                          <Image
                            src={logo}
                            alt=""
                            width={16}
                            height={16}
                            loading="lazy"
                            className="block h-4 w-4"
                          />
                        </a>
                      ) : (
                        <span
                          key={tag}
                          className="border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
                        >
                          {tag}
                        </span>
                      );
                    })}
                    {extraTags > 0 && (
                      <span className="font-mono text-[10px] text-faint tabular-nums">
                        +{extraTags}
                      </span>
                    )}
                  </div>

                  {/* Engagement facts — one compact line each */}
                  <div className="relative mt-3 space-y-1.5">
                    <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-foreground">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" style={{ color: cat.bg }} aria-hidden="true" />
                      <span className="truncate">{item.bestFor}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-muted uppercase tabular-nums">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      <span className="truncate">{item.timeline}</span>
                    </p>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(expanded ? null : globalIndex)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-muted uppercase transition-colors duration-200 hover:text-accent"
                    >
                      {t.services.details}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-300",
                          expanded && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <div className="flex items-center gap-2">
                    <a
                      href="#contact"
                      aria-label={`${t.services.ctaButton} — ${item.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-0.5"
                      style={{ backgroundColor: cat.bg, color: cat.fg }}
                    >
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(slug)}
                      aria-label={copiedKey === slug ? copiedAria : copyAria}
                      title={copiedKey === slug ? copiedAria : copyAria}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors duration-200 hover:border-accent/60 hover:text-accent"
                    >
                      {copiedKey === slug ? (
                        <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        key="details"
                        id={panelId}
                        {...view({
                          initial: { height: 0, opacity: 0 },
                          animate: { height: "auto", opacity: 1 },
                          exit: { height: 0, opacity: 0 },
                          transition: { duration: 0.3, ease: "easeInOut" },
                        })}
                        className="relative overflow-hidden"
                      >
                        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                          {item.points.map((point, pi) => (
                            <motion.li
                              key={point}
                              {...view({
                                initial: { opacity: 0, x: -10 },
                                animate: { opacity: 1, x: 0 },
                                transition: { duration: 0.25, delay: 0.05 + pi * 0.05 },
                              })}
                              className="flex items-start gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-2 text-[13px] text-foreground"
                            >
                              <span
                                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: cat.soft }}
                              >
                                <Check
                                  className="h-3 w-3"
                                  style={{ color: cat.bg }}
                                  aria-hidden="true"
                                />
                              </span>
                              {point}
                            </motion.li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={orderHref(item.title)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${t.services.ctaButton} — ${item.title} (WhatsApp)`}
                            className="group/order relative inline-flex flex-1 items-center justify-center gap-1.5 overflow-hidden px-4 py-2.5 text-[13px] font-bold transition-transform duration-200 hover:-translate-y-0.5"
                            style={{
                              backgroundColor: cat.bg,
                              color: cat.fg,
                              boxShadow: `0 10px 28px -12px ${cat.bg}`,
                            }}
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-white/30 blur-md transition-transform duration-700 group-hover/order:translate-x-[380%]"
                            />
                            <MessageCircle className="relative h-3.5 w-3.5" aria-hidden="true" />
                            <span className="relative">{t.services.ctaButton}</span>
                            <ArrowUpRight className="relative h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                          <a
                            href="#projects"
                            className="inline-flex items-center gap-1.5 border border-border px-4 py-2 text-[13px] font-bold text-muted transition-colors duration-200 hover:border-accent/60 hover:text-accent"
                          >
                            {proofLabel}
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ——— Pagination ——— */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="group inline-flex cursor-pointer items-center gap-2 border border-accent/50 px-7 py-3 text-sm font-bold text-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" aria-hidden="true" />
              {moreLabel} ({filtered.length - items.length})
            </button>
          ) : (
            filtered.length > PAGE_SIZE && (
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

        {/* ——— HR assurances — why hiring is risk-free ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {ASSURANCES.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.en}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-5 py-4 backdrop-blur-md transition-colors duration-300 hover:border-accent/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-foreground">
                  {lang === "fr" ? a.fr : a.en}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* ——— Full arsenal — every skill, icons only ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-10 border border-border bg-surface/40 px-6 py-8"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
              {lang === "fr" ? "Le même arsenal partout" : "The same arsenal everywhere"}
            </p>
            <p className="font-display text-xl font-bold text-foreground sm:text-2xl">
              {lang === "fr"
                ? "Chaque service est propulsé par ces outils"
                : "Every service powered by these tools"}
            </p>
            <a
              href="#skills"
              className="group/link mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors duration-200 hover:text-accent"
            >
              {lang === "fr" ? "Voir la maîtrise" : "View mastery"}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </a>
          </div>
          <div
            aria-label={lang === "fr" ? "Arsenal des technologies" : "Technology arsenal"}
            className="marquee-rev relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          >
            <div className="marquee-rev-track flex w-max items-center gap-3">
              {[...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                <a
                  key={`${tech.name}-${i}`}
                  href="#skills"
                  title={tech.name}
                  aria-label={tech.name}
                  aria-hidden={i >= TECH_STACK.length ? true : undefined}
                  tabIndex={i >= TECH_STACK.length ? -1 : 0}
                  className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-white/[0.04] transition-all duration-300 hover:scale-110 hover:border-accent/60"
                >
                  <Image
                    src={tech.logo}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    className="block h-7 w-7"
                  />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ——— Process strip ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-10 border border-border bg-surface/40"
        >
          <p className="border-b border-border px-6 py-3 text-center font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
            {t.services.processLabel}
          </p>
          <ol className="grid grid-cols-2 lg:grid-cols-4">
            {t.services.process.map((step, i) => (
              <li
                key={step.title}
                className="group relative flex flex-col gap-1.5 border-border px-6 py-6 max-lg:odd:border-r lg:border-r lg:last:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b"
              >
                <span className="flex items-center gap-3">
                  <span className="display text-3xl font-bold text-accent tabular-nums">
                    0{i + 1}
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
                </span>
                <p className="font-display text-base font-bold text-foreground">{step.title}</p>
                <p className="text-[13px] leading-relaxed text-muted">{step.desc}</p>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* ——— CTA band ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mt-10 flex flex-col items-center gap-5 overflow-hidden rounded-2xl p-[1.5px]"
          style={{
            background: "linear-gradient(120deg, rgba(215,253,68,0.5), rgba(255,61,0,0.5) 45%, rgba(167,139,250,0.5))",
            boxShadow: "0 0 60px -20px rgba(255,61,0,0.5)",
          }}
        >
          <div className="relative flex w-full flex-col items-center gap-5 overflow-hidden rounded-[calc(1rem-1.5px)] bg-surface/95 px-6 py-10 text-center backdrop-blur-xl sm:py-12">
          <span
            aria-hidden="true"
            className="display pointer-events-none absolute -top-4 right-4 text-7xl font-bold text-foreground/[0.05] select-none sm:text-8xl"
          >
            →
          </span>
          <h3 className="display relative text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.services.ctaTitle}
          </h3>
          <a
            href="#contact"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-accent px-8 py-4 text-sm font-bold text-accent-foreground shadow-[0_16px_44px_-14px_var(--accent)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-14px_var(--accent)]"
          >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-black/25 blur-md transition-transform duration-700 group-hover:translate-x-[380%]"
              />
            <span className="relative">{t.services.ctaButton}</span>
            <ArrowUpRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          </div>
        </motion.div>
      </div>

      {/* Glass dossier — same language as the certificates lightbox */}
      <GlassModal
        open={detailTitle !== null}
        onClose={() => setDetailTitle(null)}
        label={detailTitle ?? "Service details"}
        accent="#38bdf8"
        wide
      >
        {detailTitle !== null &&
          (() => {
            const s = source.find((x) => x.title === detailTitle);
            if (!s) return null;
            const cat = CAT_COLORS[s.category];
            const CustomIcon = libIcon(s.icon);
            return (
              <div>
                <span
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
                  style={{ backgroundColor: cat.bg, color: cat.fg, boxShadow: `0 0 28px ${cat.bg}66` }}
                >
                  {s.iconImage ? (
                    <span className="relative block h-full w-full p-2">
                      <SmartImage src={s.iconImage} alt="" fill fit="contain" sizes="64px" />
                    </span>
                  ) : CustomIcon ? (
                    <CustomIcon className="h-7 w-7" aria-hidden="true" />
                  ) : (
                    <Check className="h-7 w-7" aria-hidden="true" />
                  )}
                </span>
                <h3 className="font-display mt-4 text-2xl font-black text-white sm:text-3xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.tags.map((tag) => {
                    const logo = techLogo(tag);
                    return (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase"
                      >
                        {logo && <Image src={logo} alt="" width={12} height={12} loading="lazy" className="block h-3 w-3" />}
                        {tag}
                      </span>
                    );
                  })}
                </div>
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {s.points.map((point) => (
                    <li key={point.slice(0, 24)} className="flex items-start gap-2 text-sm text-white/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cat.bg }} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">Best for · </span>
                    {s.bestFor}
                  </p>
                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white/70 tabular-nums">
                    <span className="tracking-[0.2em] text-white/40 uppercase">Timeline · </span>
                    {s.timeline}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={orderHref(s.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                    style={{ backgroundColor: cat.bg, color: cat.fg }}
                  >
                    {t.services.ctaButton}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#contact"
                    onClick={() => setDetailTitle(null)}
                    className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70"
                  >
                    {proofLabel}
                  </a>
                </div>
              </div>
            );
          })()}
      </GlassModal>
    </section>
  );
}
