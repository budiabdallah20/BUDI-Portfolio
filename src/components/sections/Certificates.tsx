"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Award, BadgeCheck, Check, Copy, ExternalLink, ImagePlus, Link2, Plus, Search, X } from "lucide-react";
import CountUp from "@/components/CountUp";
import GlassModal from "@/components/GlassModal";
import type { AdminCert } from "@/components/admin/store";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { techLogo } from "@/data/techLogos";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";

interface Cert {
  title: { en: string; fr: string };
  issuer: { en: string; fr: string };
  year: string;
  months: number;
  id: string;
  skills: string[];
  /** Drop the file in public/images/certificates/ and set the path — card upgrades itself. */
  image: string | null;
  verify: string | null;
}

/** Grid page size — the shelf grows to 100+ with one tap. */
const PAGE_SIZE = 8;

// Real credentials from the live portfolio — no placeholders, no fakes.
const CERTS: Cert[] = [
  {
    title: { en: "AWS Solutions Architect", fr: "AWS Solutions Architect" },
    issuer: { en: "Amazon Web Services", fr: "Amazon Web Services" },
    year: "2024",
    months: 6,
    id: "CERT-AWS-24",
    skills: ["AWS", "EC2", "S3"],
    image: "/images/certificates/aws.svg",
    verify: null,
  },
  {
    title: { en: "Meta Frontend Developer", fr: "Meta Frontend Developer" },
    issuer: { en: "Meta", fr: "Meta" },
    year: "2023",
    months: 8,
    id: "CERT-META-23",
    skills: ["React", "JavaScript"],
    image: "/images/certificates/meta.svg",
    verify: null,
  },
  {
    title: { en: "Google UX Design", fr: "Google UX Design" },
    issuer: { en: "Google", fr: "Google" },
    year: "2023",
    months: 6,
    id: "CERT-GOOGLE-23",
    skills: ["Figma", "UX"],
    image: "/images/certificates/google.svg",
    verify: null,
  },
  {
    title: { en: "Full Stack Web Development", fr: "Développement Web Full-Stack" },
    issuer: { en: "Coursera", fr: "Coursera" },
    year: "2023",
    months: 12,
    id: "CERT-COURSERA-23",
    skills: ["MongoDB", "Express", "React", "Node.js"],
    image: "/images/certificates/coursera.svg",
    verify: null,
  },
  {
    title: { en: "Cybersecurity Fundamentals", fr: "Fondamentaux Cybersécurité" },
    issuer: { en: "IBM", fr: "IBM" },
    year: "2024",
    months: 4,
    id: "CERT-IBM-24",
    skills: ["Security", "Network"],
    image: "/images/certificates/ibm.svg",
    verify: null,
  },
  {
    title: { en: "DevOps Engineering", fr: "Ingénierie DevOps" },
    issuer: { en: "Microsoft", fr: "Microsoft" },
    year: "2024",
    months: 5,
    id: "CERT-MS-24",
    skills: ["Azure", "Docker"],
    image: "/images/certificates/ms.svg",
    verify: null,
  },
];

const COPY = {
  en: {
    eyebrow: "06 · Certificates",
    title: "Certificates",
    lede: "Proof of craft — verified credentials behind the claims.",
    addImage: "Certificate image coming soon",
    verify: "Verify",
    verifySoon: "Verify soon",
    search: "Search certificates…",
    empty: "No certificates match.",
    reset: "Reset",
    showing: "Showing",
    totalLabel: "Certificates",
    vendorsLabel: "Issuers",
    more: "Show more",
    less: "Show less",
  },
  fr: {
    eyebrow: "06 · Certificats",
    title: "Certificats",
    lede: "La preuve du savoir-faire — des titres vérifiés derrière les promesses.",
    addImage: "Image du certificat bientôt",
    verify: "Vérifier",
    verifySoon: "Bientôt vérifiable",
    search: "Rechercher…",
    empty: "Aucun certificat.",
    reset: "Réinitialiser",
    showing: "Affichage",
    totalLabel: "Certificats",
    vendorsLabel: "Organismes",
    more: "Voir plus",
    less: "Voir moins",
  },
} as const;

/**
 * Certificates — a dense trophy shelf built for 100+ credentials:
 * compact 4-per-row cards, year tabs, live search, paged reveal,
 * hover zoom + fullscreen lightbox once a real image lands.
 */
export default function Certificates({ remote }: { remote?: AdminCert[] }): React.JSX.Element {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const t = lang === "fr" ? COPY.fr : COPY.en;
  const fr = lang === "fr";

  /** Database wins when it has rows — baked-in list is the fallback. Hidden (eye-off) rows never reach the site. */
  const certs: Cert[] = useMemo<Cert[]>(() => {
    if (remote && remote.length > 0) {
      return remote
        .filter((r) => r.visible !== false)
        .map((r) => ({
        title: { en: r.titleEn, fr: r.titleFr },
        issuer: { en: r.issuerEn, fr: r.issuerFr },
        year: r.year,
        months: r.months,
        id: r.id,
        skills: r.skills,
        image: r.image || null,
        verify: r.verify || null,
      }));
    }
    return CERTS;
  }, [remote]);
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const resetPage = (): void => setVisibleCount(PAGE_SIZE);

  const years = useMemo(
    () => [...new Set(certs.map((c) => c.year))].sort().reverse(),
    [certs],
  );
  const vendors = useMemo(
    () => new Set(certs.map((c) => (fr ? c.issuer.fr : c.issuer.en))).size,
    [certs, fr],
  );
  const filteredAll = certs.filter((cert) => {
    if (tab !== "all" && cert.year !== tab) return false;
    const q = query.trim().toLowerCase();
    if (q === "") return true;
    const title = fr ? cert.title.fr : cert.title.en;
    const issuer = fr ? cert.issuer.fr : cert.issuer.en;
    return (
      title.toLowerCase().includes(q) ||
      issuer.toLowerCase().includes(q) ||
      cert.skills.some((s) => s.toLowerCase().includes(q))
    );
  });
  const filtered = filteredAll.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAll.length;
  const detailCert = detailId === null ? null : certs.find((c) => c.id === detailId) ?? null;

  const copyText = (key: string, text: string): void => {
    try {
      void navigator.clipboard?.writeText(text)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((cur) => (cur === key ? null : cur));
    }, 1600);
  };

  /** Cursor spotlight + gentle tilt — direct DOM writes, no re-renders. */
  const onCardMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${(event.clientX - rect.left).toFixed(0)}px`);
    el.style.setProperty("--sy", `${(event.clientY - rect.top).toFixed(0)}px`);
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * 2.5).toFixed(2)}deg) rotateY(${(px * 3).toFixed(2)}deg)`;
  };
  const onCardLeave = (event: React.MouseEvent<HTMLElement>): void => {
    event.currentTarget.style.transform = "";
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  return (
    <section
      id="certificates"
      aria-labelledby="certificates-heading"
      className="relative overflow-clip border-t border-border py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 85% 10%, rgba(255,61,0,0.07), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-16 right-0 hidden text-[20vw] leading-none opacity-20 select-none md:block"
      >
        05
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
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
            id="certificates-heading"
            className="display mt-4 text-4xl font-bold tracking-tight text-accent drop-shadow-[0_0_28px_rgba(255,61,0,0.25)] md:text-6xl xl:text-7xl"
          >
            {t.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t.lede}
          </p>
        </div>

        {/* Counters */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 border-y border-border">
          {[
            { n: certs.length, label: t.totalLabel },
            { n: vendors, label: t.vendorsLabel },
            { n: certs.filter((c) => c.year === "2024").length, label: "2024" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-6 text-center">
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

        {/* Tabs + search */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t.title}>
            {["all", ...years].map((y) => {
              const isActive = tab === y;
              const label = y === "all" ? (fr ? "Tout" : "All") : y;
              const count = y === "all" ? certs.length : certs.filter((c) => c.year === y).length;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setTab(y); resetPage(); }}
                  aria-pressed={isActive}
                  className={`border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                    isActive
                      ? "border-accent bg-accent font-bold text-accent-foreground"
                      : "border-border text-muted hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className="ml-2 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <label className="flex w-full max-w-xl items-center gap-2 border border-border bg-surface/60 px-4 py-2.5 transition-colors focus-within:border-accent/60">
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
          <p className="font-mono text-[11px] tracking-[0.2em] text-faint uppercase tabular-nums" role="status">
            {t.showing} {filtered.length}/{filteredAll.length}
          </p>
        </div>

        {filteredAll.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <p className="text-muted">{t.empty}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTab("all");
                resetPage();
              }}
              className="border border-accent/50 px-5 py-2 text-sm font-bold text-accent transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              {t.reset}
            </button>
          </div>
        ) : (
        <>
        <motion.div layout={reduced ? false : true} className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((cert, i) => {
            const visibleSkills = cert.skills.slice(0, 3);
            const extraSkills = cert.skills.length - visibleSkills.length;
            return (
            <motion.article
              key={cert.id}
              layout={reduced ? false : true}
              initial={reduced ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: (i % 4) * 0.06 }}
              onMouseMove={onCardMove}
              onMouseLeave={onCardLeave}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface/60 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_20px_60px_-28px_rgba(215,253,68,0.35)]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(360px circle at var(--sx, 50%) var(--sy, 0%), rgba(215,253,68,0.08), transparent 65%)",
                }}
              />
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 z-10 h-[2px] w-0 bg-accent shadow-[0_0_12px_rgba(255,61,0,0.8)] transition-all duration-500 group-hover:w-full"
              />
              {/* Compact image slot — 16/10, zoom on hover — opens the glass dossier */}
              <button
                type="button"
                onClick={() => setDetailId(cert.id)}
                aria-label={fr ? cert.title.fr : cert.title.en}
                aria-haspopup="dialog"
                className={cn(
                  "relative flex aspect-[16/10] w-full cursor-pointer items-center justify-center overflow-hidden border-b border-border",
                )}
              >
                {cert.image ? (
                  <SmartImage
                    src={cert.image}
                    alt={fr ? cert.title.fr : cert.title.en}
                    fill
                    fit="cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-2 p-4 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/[0.06] text-accent">
                      <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.2em] text-faint uppercase">
                      {t.addImage}
                    </span>
                  </span>
                )}
                <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-accent backdrop-blur-md">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-white/80 uppercase backdrop-blur-md tabular-nums">
                  {cert.year} · {cert.months}{fr ? "m" : "mo"}
                </span>
              </button>

              <div className="flex flex-1 flex-col p-3.5">
                <p className="truncate font-mono text-[9px] tracking-[0.2em] text-faint uppercase">
                  {fr ? cert.issuer.fr : cert.issuer.en}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailId(cert.id)}
                  aria-haspopup="dialog"
                  className="font-display mt-1 line-clamp-2 min-h-[2.5em] cursor-pointer text-left text-[15px] leading-snug font-bold text-foreground transition-colors hover:text-accent"
                >
                  {fr ? cert.title.fr : cert.title.en}
                </button>
                <div className="mt-2 mb-2.5 flex flex-wrap gap-1">
                  {visibleSkills.map((skill) => {
                    const logo = techLogo(skill);
                    return (
                      <span
                        key={skill}
                        className="flex items-center gap-1 border border-border px-1.5 py-px font-mono text-[9px] tracking-[0.1em] text-muted uppercase"
                      >
                        {logo && (
                          <Image
                            src={logo}
                            alt=""
                            width={10}
                            height={10}
                            loading="lazy"
                            className="block h-2.5 w-2.5"
                          />
                        )}
                        {skill}
                      </span>
                    );
                  })}
                  {extraSkills > 0 && (
                    <span className="font-mono text-[9px] text-faint tabular-nums">+{extraSkills}</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="truncate font-mono text-[9px] tracking-[0.14em] text-faint uppercase tabular-nums">
                    {cert.id}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(cert.id)}
                      aria-haspopup="dialog"
                      className="cursor-pointer font-mono text-[10px] tracking-[0.18em] text-muted uppercase transition-colors duration-200 hover:text-accent"
                    >
                      {fr ? "Détails" : "Details"} →
                    </button>
                    {cert.verify ? (
                      <a
                        href={cert.verify}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-accent transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.verify}
                    </a>
                  ) : (
                    <span className="inline-flex shrink-0 cursor-not-allowed items-center gap-1 text-[11px] font-semibold text-faint">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.verifySoon}
                    </span>
                  )}
                  </span>
                </div>
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

      {/* Glass dossier — full certificate file: image + issuer + meta + skills + verify */}
      <GlassModal
        open={detailCert !== null}
        onClose={() => setDetailId(null)}
        label={detailCert ? (fr ? detailCert.title.fr : detailCert.title.en) : "Certificate details"}
        accent="#d7fd44"
        wide
      >
        {detailCert !== null &&
          (() => {
            const c = detailCert;
            const title = fr ? c.title.fr : c.title.en;
            const issuer = fr ? c.issuer.fr : c.issuer.en;
            const verifySoon = !c.verify;
            return (
              <div>
                {/* Banner — reference cert-card: image h-64 zoom, click = fullscreen */}
                {c.image ? (
                  <button
                    type="button"
                    onClick={() => setLightbox(certs.indexOf(c))}
                    aria-label={fr ? `Agrandir — ${title}` : `Zoom — ${title}`}
                    className="group/banner relative mb-5 block aspect-[16/8] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-white/10"
                  >
                    <SmartImage
                      src={c.image}
                      alt={title}
                      fill
                      fit="cover"
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover transition-transform duration-700 group-hover/banner:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                    />
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-white/85 uppercase backdrop-blur-md tabular-nums">
                      {c.year} · {c.months}{fr ? "m" : "mo"}
                    </span>
                    <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white/80 backdrop-blur-md transition-colors group-hover/banner:text-accent">
                      <Search className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                ) : null}
                <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">
                  <Award className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {issuer} · {c.year}
                </p>
                <h3 className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">ID</p>
                    <p className="truncate text-sm font-bold text-white tabular-nums" title={c.id}>{c.id}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{fr ? "Durée" : "Length"}</p>
                    <p className="text-sm font-bold text-white tabular-nums">{c.months}{fr ? " mois" : " mo"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 max-sm:col-span-2">
                    <p className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">{fr ? "Organisme" : "Issuer"}</p>
                    <p className="truncate text-sm font-bold text-white">{issuer}</p>
                  </div>
                </div>
                {c.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.skills.map((skill) => {
                      const logo = techLogo(skill);
                      return (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/70 uppercase"
                        >
                          {logo && <Image src={logo} alt="" width={12} height={12} loading="lazy" className="block h-3 w-3" />}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                )}
                {/* Verify box — full URL + copy + open, like project repo box */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl">
                  <p className="font-mono text-[9px] tracking-[0.22em] text-white/40 uppercase">
                    {fr ? "Vérification" : "Verification"}
                  </p>
                  {c.verify ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <p className="truncate font-mono text-xs text-white/60" dir="ltr" title={c.verify}>{c.verify}</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={c.verify}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                          {t.verify}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText(`verify-${c.id}`, c.verify as string)}
                          className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-xl border border-white/15 text-white/60 transition-colors hover:border-accent/60 hover:text-accent"
                          aria-label={copiedKey === `verify-${c.id}` ? "Copied" : "Copy verify link"}
                        >
                          {copiedKey === `verify-${c.id}` ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-white/40">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      {t.verifySoon}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => copyText(`id-${c.id}`, c.id)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-bold text-white/70 transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    {copiedKey === `id-${c.id}` ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copiedKey === `id-${c.id}` ? (fr ? "Copié" : "Copied") : "Copy ID"}
                  </button>
                  {c.image && (
                    <button
                      type="button"
                      onClick={() => setLightbox(certs.indexOf(c))}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-black transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      {fr ? "Voir l'image" : "View image"}
                    </button>
                  )}
                </div>
                <p className="mt-4 text-center font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
                  BUDI · {c.year} · {fr ? "Signé" : "Signed"}
                </p>
              </div>
            );
          })()}
      </GlassModal>

      {/* Lightbox — fullscreen image once opened from the dossier */}
      <AnimatePresence>
        {lightbox !== null && certs[lightbox]?.image && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={fr ? certs[lightbox]?.title.fr : certs[lightbox]?.title.en}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-10"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-full w-full max-w-4xl overflow-hidden border border-border bg-surface"
            >
              <SmartImage
                src={certs[lightbox].image as string}
                alt={fr ? (certs[lightbox]?.title.fr ?? "") : (certs[lightbox]?.title.en ?? "")}
                width={1200}
                height={900}
                className="max-h-[80vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label={fr ? "Fermer" : "Close"}
                className="absolute top-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-md transition-colors hover:text-accent"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
