"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Cake,
  Calendar,
  Check,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  FolderGit,
  Gauge,
  Globe,
  GraduationCap,
  HardDrive,
  Hash,
  Heart,
  ImagePlus,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  LogOut,
  Palette,
  Pencil,
  Plus,
  Quote,
  RefreshCcw,
  Search,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { skillProjectUsage } from "@/lib/skill-usage";
import Logo from "@/components/Logo";
import { availabilityFromSettings, formatBadgeDate, workDeadlineSuffix, workLabel } from "@/components/WorkStatus";
import { logout } from "./Login";
import { logoutWorkspace } from "./workspaces";
import {
  bumpVisit,
  certSchema,
  checkIntegrity,
  exportJSON,
  importJSON,
  loadDB,
  normalizeSettings,
  projectSchema,
  readLiked,
  readSkillLiked,
  readVisits,
  resetDB,
  saveDB,
  serviceSchema,
  skillSchema,
  skillLikesKey,
  uid,
  validate,
  fromRemote,
  CATEGORY_DEFAULTS,
  type AdminCert,
  type AdminDB,
  type AdminProject,
  type AdminService,
  type AdminSettings,
  type AdminSkill,
  type IntegrityCheck,
  type RailState,
  type ServiceCategory,
} from "./store";
import { techLogo } from "@/data/techLogos";
import { LIB_ICON_CHOICES, LIB_ICONS, libIcon } from "@/lib/brandIcons";
import SmartImage from "@/components/SmartImage";
import { VERSES } from "@/data/verses";
import { personal } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import {
  ApiError,
  fetchSnapshot,
  remoteRemove,
  remoteSave,
  remoteSeed,
  requestRevalidate,
} from "./remote";

type Tab = "home" | "services" | "skills" | "projects" | "certs" | "settings";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Cpu },
  { id: "projects", label: "Projects", icon: FolderGit },
  { id: "certs", label: "Certificates", icon: Award },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/** Craft identity per service category — same language as the live section. */
const CAT_STYLE: Record<
  ServiceCategory,
  { bg: string; fg: string; wash: string; icon: typeof Globe }
> = {
  development: {
    bg: "#ff3d00",
    fg: "#1a0e05",
    wash: "linear-gradient(135deg, rgba(255,61,0,0.16) 0%, transparent 60%)",
    icon: Globe,
  },
  design: {
    bg: "#38bdf8",
    fg: "#082f49",
    wash: "linear-gradient(135deg, rgba(56,189,248,0.16) 0%, transparent 60%)",
    icon: Palette,
  },
  backend: {
    bg: "#a78bfa",
    fg: "#2e1065",
    wash: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, transparent 60%)",
    icon: Server,
  },
  growth: {
    bg: "#fbbf24",
    fg: "#451a03",
    wash: "linear-gradient(135deg, rgba(251,191,36,0.16) 0%, transparent 60%)",
    icon: Gauge,
  },
};

const CAT_LABEL: Record<ServiceCategory, string> = {
  development: "Development",
  design: "Design",
  backend: "Backend",
  growth: "Growth",
};

const LEVEL_COLOR: Record<string, string> = {
  expert: "#d7fd44",
  advanced: "#38bdf8",
  intermediate: "#fbbf24",
};

const PROOF_LABEL: Record<AdminSkill["proof"], string> = {
  daily: "Daily driver",
  portfolio: "Powers portfolio",
  client: "Client projects",
  learning: "Leveling up",
};

const LOGO_PRESETS = [
  "/icons/tech/react.svg",
  "/icons/tech/nextjs.svg",
  "/icons/tech/typescript.svg",
  "/icons/tech/javascript.svg",
  "/icons/tech/tailwind.svg",
  "/icons/tech/html.svg",
  "/icons/tech/css.svg",
  "/icons/tech/nodejs.svg",
  "/icons/tech/git.svg",
  "/icons/tech/gsap.svg",
  "/icons/tech/framer.svg",
  "/icons/tech/figma.svg",
];

const levelTag = (level: number): string =>
  level >= 85 ? "Expert" : level >= 70 ? "Advanced" : "Intermediate";

const levelKeyOf = (level: number): string =>
  level >= 85 ? "expert" : level >= 70 ? "advanced" : "intermediate";

/** Cache-busted preview URL — `?fresh=` forces the browser to skip its
 *  HTTP cache for the document, so a preview always shows the latest code. */
function bustPreview(href: string, nonce: number): string {
  if (nonce <= 0) return href;
  const hashIndex = href.indexOf("#");
  const path = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}fresh=${nonce}${hash}`;
}

/* ------------------------------ primitives ------------------------------ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[9px] tracking-[0.08em] text-white/30 normal-case">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-all placeholder:text-white/25 focus:border-[#ff3d00] focus:shadow-[0_0_0_3px_rgba(255,61,0,0.18)]";

/* ------------------------- media upload helpers ------------------------ */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DATAURL_CHARS = 1400000;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(String(reader.result));
    reader.onerror = (): void => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

/**
 * File → compact data URL. Photos downscale through canvas (JPEG, max
 * 1280px), PNG keeps transparency (max 1000px), SVG/GIF pass through
 * untouched (SVG without scripts only). Rejects anything hostile or huge —
 * the whole DB lives in localStorage + one Supabase row, so bytes matter.
 */
async function fileToDataURL(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files — PNG, JPG, SVG, WebP, GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too big — 10MB max, try a smaller file.");
  }
  if (file.type === "image/svg+xml") {
    const text = await file.text();
    if (/<script|on\w+\s*=/i.test(text)) throw new Error("SVG with scripts is blocked.");
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    if (url.length > MAX_DATAURL_CHARS) throw new Error("SVG is too big after encoding.");
    return url;
  }
  if (file.type === "image/gif") {
    const url = await readAsDataURL(file);
    if (url.length > MAX_DATAURL_CHARS) throw new Error("GIF is too big — 1MB max.");
    return url;
  }
  try {
    const bmp = await createImageBitmap(file);
    const maxDim = file.type === "image/png" ? 1000 : 1280;
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser blocked image processing.");
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const url =
      file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
    if (url.length > MAX_DATAURL_CHARS) throw new Error("Image is too big — try a smaller file.");
    return url;
  } catch (e) {
    if (e instanceof Error && e.message !== "Browser blocked image processing.") throw e;
    const url = await readAsDataURL(file);
    if (url.length > MAX_DATAURL_CHARS) throw new Error("Image is too big — try a smaller file.");
    return url;
  }
}

/** Upload-or-paste image field — preview, file picker, URL input, clear. */
function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  pastePlaceholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  pastePlaceholder?: string;
}): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      onChange(await fileToDataURL(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <div>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {label}
        </span>
        <span className="flex items-center gap-3">
          {hint && (
            <span className="font-mono text-[9px] tracking-[0.08em] text-white/30 normal-case">{hint}</span>
          )}
          {value !== "" && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setErr(null);
              }}
              className="cursor-pointer font-mono text-[9px] tracking-[0.08em] text-white/30 uppercase transition-colors hover:text-red-400"
            >
              Clear
            </button>
          )}
        </span>
      </span>
      {value !== "" && (
        <span className="relative mb-2 block aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/15 bg-black/50">
          <SmartImage src={value} alt="" fill fit="cover" sizes="(max-width: 640px) 100vw, 560px" />
        </span>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition-all hover:-translate-y-0.5 hover:border-white/35 hover:text-white disabled:opacity-50"
        >
          {busy ? <RefreshCcw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Processing…" : value !== "" ? "Replace upload" : "Upload image"}
        </button>
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => {
              onChange(e.target.value.trim());
              setErr(null);
            }}
            dir="ltr"
            placeholder={pastePlaceholder ?? "/images/… or https://…"}
            className={cn(inputCls, "pl-10")}
            maxLength={1500000}
          />
        </div>
      </div>
      {value.startsWith("data:") && (
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-emerald-300/70 uppercase">
          ✓ Uploaded file embedded — syncs to cloud with the row
        </p>
      )}
      {err && (
        <p role="alert" className="mt-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {err}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        aria-label={`${label} file picker`}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}

/** Library-icon quick pick — one tap sets the code, tapping again clears. */
function LibIconPicker({
  value,
  onPick,
  accent,
}: {
  value: string;
  onPick: (name: string) => void;
  accent: string;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8" role="group" aria-label="Library icons">
      {LIB_ICON_CHOICES.map(({ name, label }) => {
        const Icon = LIB_ICONS[name];
        if (!Icon) return null;
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            title={label}
            aria-label={`Library icon ${label}`}
            aria-pressed={active}
            onClick={() => onPick(active ? "" : name)}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5",
              active ? "border-transparent" : "border-white/10 bg-white/[0.04] hover:border-white/30",
            )}
            style={active ? { borderColor: `${accent}88`, backgroundColor: `${accent}1a`, boxShadow: `0 0 14px ${accent}44`, color: accent } : { color: "rgba(255,255,255,0.55)" }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/** Tri-state rail switch — Active / Soon / Off. One control per method. */
function TriState({
  value,
  onPick,
}: {
  value: RailState;
  onPick: (v: RailState) => void;
}): React.JSX.Element {
  const opts: { id: RailState; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "soon", label: "Soon" },
    { id: "off", label: "Off" },
  ];
  return (
    <div className="flex rounded-xl border border-white/10 bg-black/40 p-1" role="group" aria-label="Method state">
      {opts.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            aria-pressed={on}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-2 py-2 font-mono text-[10px] font-black tracking-[0.12em] uppercase transition-all",
              on
                ? o.id === "active"
                  ? "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.5)]"
                  : o.id === "soon"
                    ? "bg-amber-300 text-black shadow-[0_0_16px_rgba(252,211,77,0.5)]"
                    : "bg-white/15 text-white"
                : "text-white/40 hover:text-white",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Deadline picker — ISO date + one-tap clear, dark calendar included. */
function DeadlineInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}): React.JSX.Element {
  return (
    <div>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {label}
        </span>
        {value !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="cursor-pointer font-mono text-[9px] tracking-[0.08em] text-white/30 uppercase transition-colors hover:text-white"
          >
            Clear
          </button>
        )}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, "tabular-nums [color-scheme:dark]")}
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all",
        checked
          ? "border-emerald-400/40 bg-emerald-400/[0.07]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25",
      )}
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-emerald-400" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className={cn("block text-xs font-bold", checked ? "text-emerald-300" : "text-white/70")}>
          {label}
        </span>
        {desc && <span className="mt-0.5 block text-[11px] leading-snug text-white/40">{desc}</span>}
      </span>
    </button>
  );
}

/** Professional add/edit window — gradient crown, icon tile, live count, ESC to close. */
function Modal({
  title,
  subtitle,
  icon,
  accent = "#ff3d00",
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof Plus;
  accent?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return (): void => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  const Icon = icon ?? Sparkles;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "animate-modal-pop relative w-full overflow-hidden rounded-2xl border border-white/12 bg-[#131316] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: `linear-gradient(180deg, ${accent}26 0%, transparent 100%)` }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        <div className="relative flex items-start gap-4 p-6 pb-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `${accent}1f`,
              borderColor: `${accent}55`,
              color: accent,
              boxShadow: `0 0 28px ${accent}44`,
            }}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl leading-tight font-black text-white sm:text-2xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-white/45 uppercase">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:rotate-90 hover:border-[#ff3d00] hover:text-[#ff3d00]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative max-h-[72vh] overflow-y-auto p-6 pt-2">{children}</div>
      </div>
    </div>
  );
}

/** Animated counter — tabular numbers that count up on mount. */
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVal(target);
        return;
      }
    } catch {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return (): void => {
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);
  return val;
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
  color,
}: {
  icon: typeof Users;
  value: number;
  label: string;
  accent?: boolean;
  color?: string;
}): React.JSX.Element {
  const shown = useCountUp(value);
  const c = accent ? "#ff3d00" : (color ?? "#ffffff");
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${c}22 0%, transparent 60%)` }}
      />
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
        style={{ background: c, boxShadow: `0 0 16px ${c}` }}
      />
      <span
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border"
        style={{ backgroundColor: `${c}1a`, borderColor: `${c}44`, color: c }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="font-display relative mt-4 text-4xl font-black tracking-tight tabular-nums">
        {shown.toLocaleString("en-US")}
      </p>
      <p className="relative mt-1.5 font-mono text-[10px] font-bold tracking-[0.24em] text-white/50 uppercase">
        {label}
      </p>
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string }): React.JSX.Element {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
    </div>
  );
}

/** The honesty badge — green LIVE means the site shows it, gray HIDDEN means it doesn't. */
function LiveBadge({ visible }: { visible: boolean }): React.JSX.Element {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.16em] uppercase",
        visible
          ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.25)]"
          : "border-white/15 bg-white/[0.04] text-white/40",
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {visible && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            visible ? "bg-emerald-400" : "bg-white/30",
          )}
        />
      </span>
      {visible ? "Live" : "Hidden"}
    </span>
  );
}

function ServiceMiniPreview({
  title,
  category,
  tags,
  points,
  visible,
  accent,
  icon,
  iconImage,
}: {
  title: string;
  category: ServiceCategory;
  tags: string[];
  points: string[];
  visible: boolean;
  accent: string;
  icon?: string;
  iconImage?: string;
}): React.JSX.Element {
  const CatIcon = CAT_STYLE[category]?.icon ?? Globe;
  const LibIcon = libIcon(icon);
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: accent, color: "#140b04" }}>
        {iconImage ? (
          <span className="relative block h-full w-full p-1">
            <SmartImage src={iconImage} alt="" fill fit="contain" sizes="40px" />
          </span>
        ) : LibIcon ? (
          <LibIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <CatIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{title || "Untitled service"}</p>
        <p className="truncate font-mono text-[10px] text-white/40 uppercase">
          {CAT_LABEL[category]} · {tags.length} tags · {points.length} deliverables · {visible ? "LIVE on site" : "HIDDEN"}
        </p>
      </div>
      <LiveBadge visible={visible} />
    </div>
  );
}

/** Live site-card mirror while editing a project — cover, title, stack, status. */
function ProjectMiniPreview({
  title,
  tech,
  status,
  visible,
  image,
}: {
  title: string;
  tech: string[];
  status: AdminProject["status"];
  visible: boolean;
  image?: string;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      {image ? (
        <span className="relative block h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
          <SmartImage src={image} alt="" fill fit="cover" sizes="64px" />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff3d00]/15 font-display text-lg font-black text-[#ff3d00]">
          {(title.charAt(0) || "?").toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{title || "Untitled project"}</p>
        <p className="truncate font-mono text-[10px] text-white/40 uppercase">
          {status} · {tech.length} stack · {visible ? "LIVE on site" : "HIDDEN"}
        </p>
      </div>
      <LiveBadge visible={visible} />
    </div>
  );
}

/** Live site-card mirror while editing a certificate — image, title + issuer. */
function CertMiniPreview({
  titleEn,
  issuerEn,
  year,
  visible,
  image,
}: {
  titleEn: string;
  issuerEn: string;
  year: string;
  visible: boolean;
  image?: string;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      {image ? (
        <span className="relative block h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white">
          <SmartImage src={image} alt="" fill fit="contain" sizes="64px" />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa]/15 text-[#a78bfa]">
          <Award className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{titleEn || "Untitled credential"}</p>
        <p className="truncate font-mono text-[10px] text-white/40 uppercase">
          {issuerEn || "Unknown issuer"} · {year || "—"} · {visible ? "LIVE on site" : "HIDDEN"}
        </p>
      </div>
      <LiveBadge visible={visible} />
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}): React.JSX.Element {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition-colors focus-within:border-[#ff3d00]/60">
      <Search className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="cursor-pointer text-white/35 transition-colors hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onPick,
}: {
  options: { id: T; label: string; count?: number; color?: string }[];
  value: T;
  onPick: (v: T) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onPick(o.id)}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition-all",
            value === o.id
              ? "border-[#ff3d00] bg-[#ff3d00] text-[#1a0e05] shadow-[0_0_20px_rgba(255,61,0,0.4)]"
              : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/30 hover:text-white",
          )}
        >
          {o.color && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: o.color }} />
          )}
          {o.label}
          {typeof o.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 tabular-nums",
                value === o.id ? "bg-black/20" : "bg-white/10",
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------- security + error sensing ------------------------ */

interface Monitor {
  checks: IntegrityCheck[];
  quota: { usage: number; quota: number } | null;
  trapped: number;
  lastError: string | null;
}

/**
 * Live security + error sensing for the local stack: integrity self-checks,
 * storage quota, a runtime error trap (window errors + unhandled rejections
 * reported through Sentry), and one Sentry breadcrumb per failing check.
 */
function useSecurityMonitor(db: AdminDB | null): Monitor {
  const [checks, setChecks] = useState<IntegrityCheck[]>([]);
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null);
  const [trapped, setTrapped] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    const list = checkIntegrity(db);
    setChecks(list);
    const failing = list.filter((c) => !c.ok && (c.key === "storage" || c.key === "database"));
    if (failing.length > 0 && !reportedRef.current) {
      reportedRef.current = true;
      try {
        Sentry.captureMessage(`Admin integrity failing: ${failing.map((f) => f.key).join(", ")}`, "warning");
      } catch {
        /* monitoring unavailable — panel still renders */
      }
    }
    let alive = true;
    try {
      const estimate = navigator.storage?.estimate?.bind(navigator.storage);
      if (estimate) {
        estimate()
          .then((e) => {
            if (alive) setQuota({ usage: e.usage ?? 0, quota: e.quota ?? 0 });
          })
          .catch(() => undefined);
      }
    } catch {
      /* quota API unavailable */
    }
    const onErr = (ev: ErrorEvent): void => {
      const msg = ev.message || "Unknown runtime error";
      setTrapped((n) => n + 1);
      setLastError(msg);
      try {
        Sentry.captureException(new Error(msg));
      } catch {
        /* ignore */
      }
    };
    const onRej = (ev: PromiseRejectionEvent): void => {
      const reason = ev.reason;
      const msg = reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
      setTrapped((n) => n + 1);
      setLastError(msg);
      try {
        Sentry.captureException(reason instanceof Error ? reason : new Error(msg));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return (): void => {
      alive = false;
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [db]);

  return { checks, quota, trapped, lastError };
}

/* -------------------------------- dashboard ------------------------------ */

export default function Dashboard({
  onLogout,
  workspaceId,
  workspaceName,
  workspaceLogo,
  workspaceTheme,
  onSwitchAccount,
  cloudSync,
}: {
  onLogout: () => void;
  /** BUDI OS workspace id — isolates storage + session per account. */
  workspaceId?: string;
  workspaceName?: string;
  /** Per-account brand in the sidebar (logo + theme). Omitted = BUDI mark. */
  workspaceLogo?: string;
  workspaceTheme?: string;
  /** Back to the BUDI OS hub (account switcher). */
  onSwitchAccount?: () => void;
  /** Local consoles skip every cloud call — zero 401 noise, pure local. */
  cloudSync?: boolean;
}): React.JSX.Element {
  /** Cloud on for the main workspace, off for local-only accounts. */
  const CLOUD = cloudSync !== false;
  const [db, setDb] = useState<AdminDB | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [editing, setEditing] = useState<
    | { kind: "service"; item: AdminService | null }
    | { kind: "skill"; item: AdminSkill | null }
    | { kind: "project"; item: AdminProject | null }
    | { kind: "cert"; item: AdminCert | null }
    | null
  >(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  /** Real-refresh state — proves the site was rebuilt, with a timestamp. */
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const settingsTimer = useRef(0);

  /** Open a preview — `hard` bypasses the browser cache via `?fresh=`. */
  const openPreview = (href: string, hard = false): void => {
    setPreview(href);
    setPreviewNonce(hard ? Date.now() : 0);
  };
  const [remote, setRemote] = useState<{
    visitsTotal: number;
    likes: Record<string, number>;
    synced: boolean;
    empty: boolean;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const dbRef = useRef<AdminDB | null>(null);

  useEffect(() => {
    setDb(loadDB());
    try {
      if (!sessionStorage.getItem("budi-visit-counted")) {
        sessionStorage.setItem("budi-visit-counted", "1");
        bumpVisit();
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Cloud sync — Supabase rows replace the local cache when present.
     Empty cloud DB is a real state: the Home tab offers one-click seeding.
     Local-only workspaces skip the network entirely (pure local console). */
  useEffect(() => {
    if (!CLOUD) {
      setRemote({ visitsTotal: 0, likes: {}, synced: false, empty: false });
      return;
    }
    let alive = true;
    fetchSnapshot()
      .then((snap) => {
        if (!alive) return;
        const hasRows =
          snap.services.length + snap.skills.length + snap.projects.length + snap.certs.length > 0;
        setRemote({ visitsTotal: snap.visitsTotal, likes: snap.likes, synced: true, empty: !hasRows });
        if (!hasRows) return;
        setDb((prev) => {
          if (!prev) return prev;
          const next = fromRemote({
            services: snap.services,
            skills: snap.skills,
            projects: snap.projects,
            certs: snap.certs,
            settings: snap.settings,
          });
          next.visitsBase = prev.visitsBase;
          next.visitsBump = prev.visitsBump;
          saveDB(next);
          return next;
        });
      })
      .catch(() => {
        if (alive) {
          setRemote((r) => r ?? { visitsTotal: 0, likes: {}, synced: false, empty: false });
        }
      });
    return (): void => {
      alive = false;
    };
    // CLOUD is fixed for the mounted workspace — re-running on change
    // would double-fetch; workspace switches remount the console.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Debounced settings sync — cleared on unmount so no cloud write fires
     after the console is gone. */
  useEffect(() => {
    return (): void => {
      window.clearTimeout(settingsTimer.current);
    };
  }, []);

  /* ESC closes the site preview window. */
  useEffect(() => {
    if (preview === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return (): void => {
      window.removeEventListener("keydown", onKey);
    };
  }, [preview]);

  const doSeed = (): void => {
    if (!CLOUD) {
      window.alert("Local workspace — cloud seeding is off. Data stays in this browser.");
      return;
    }
    const current = dbRef.current;
    if (!current || seeding) return;
    setSeeding(true);
    void remoteSeed(current)
      .then((res) => {
        window.alert(
           `Database seeded: ${res.seeded?.services ?? 0} services · ${res.seeded?.skills ?? 0} skills · ${res.seeded?.projects ?? 0} projects · ${res.seeded?.certs ?? 0} certs. The site rebuilds instantly — open any preview to see it.`,
        );
        return fetchSnapshot();
      })
      .then((snap) => {
        const hasRows =
          snap.services.length + snap.skills.length + snap.projects.length + snap.certs.length > 0;
        setRemote({ visitsTotal: snap.visitsTotal, likes: snap.likes, synced: true, empty: !hasRows });
        if (hasRows) {
          const next = fromRemote({
            services: snap.services,
            skills: snap.skills,
            projects: snap.projects,
            certs: snap.certs,
            settings: snap.settings,
          });
          saveDB(next);
          setDb(next);
        }
      })
      .catch((e: unknown) => {
        syncFailed(e, "Seed ");
      })
      .finally(() => {
        setSeeding(false);
      });
  };

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  const patch = (fn: (d: AdminDB) => void): void => {
    setDb((prev) => {
      if (!prev) return prev;
      const next: AdminDB = JSON.parse(JSON.stringify(prev)) as AdminDB;
      fn(next);
      saveDB(next);
      return next;
    });
  };

  const doLogout = (): void => {
    if (workspaceId) logoutWorkspace(workspaceId);
    else logout();
    onLogout();
  };

  const remove = (kind: "services" | "skills" | "projects" | "certs", id: string): void => {
    if (!window.confirm("Delete this item?")) return;
    patch((d) => {
      d[kind] = (d[kind] as unknown[]).filter((x) => (x as { id: string }).id !== id) as never;
    });
    if (!CLOUD) return;
    void remoteRemove(kind, id).catch((e: unknown) => {
      syncFailed(e, "Deleted locally — ");
    });
  };

  /**
   * Sync failure handler — a 401 means the tab holds a stale secret
   * (logged in before the server env changed). Instead of nagging with
   * alerts, bounce back to the PIN screen for a fresh login.
   */
  const syncFailed = (e: unknown, prefix: string): void => {
    if (e instanceof ApiError && e.status === 401) {
      window.alert("Session expired — logging you out, please log in again with the current PIN.");
      doLogout();
      return;
    }
    const msg = e instanceof Error ? e.message : "unreachable";
    window.alert(`${prefix}cloud sync failed: ${msg}`);
  };

  /** Local-first save with cloud mirror — failures stay visible, never silent. */
  const syncSave = (table: string, item: unknown): void => {
    if (!CLOUD) return;
    void remoteSave(table, item).catch((e: unknown) => {
      syncFailed(e, "Saved locally — ");
    });
  };

  /**
   * REAL site refresh — purges the live site's ISR cache server-side, so the
   * next paint (preview iframe or public visit) is rebuilt from Supabase.
   * Resolves true on success and stamps the rebuild time the UI can show.
   */
  const doRevalidate = async (): Promise<boolean> => {
    if (!CLOUD) return false;
    if (refreshing) return false;
    setRefreshing(true);
    try {
      const res = await requestRevalidate();
      setLastRefresh(res.at);
      return true;
    } catch (e: unknown) {
      syncFailed(e, "Refresh ");
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  /** Hard preview — rebuilds the live site FIRST, then opens the preview on
   *  a cache-busted URL, so what you see is provably fresh. */
  const openHardPreview = (href: string): void => {
    void (async (): Promise<void> => {
      await doRevalidate();
      setPreview(href);
      setPreviewNonce(Date.now());
    })();
  };

  /** Hard button inside the preview window — rebuild, then reload the frame. */
  const hardReloadPreview = (): void => {
    void (async (): Promise<void> => {
      if (await doRevalidate()) setPreviewNonce(Date.now());
    })();
  };

  /**
   * Settings → cloud (debounced): keystrokes patch locally instantly, the
   * cloud mirror + site rebuild follow 800ms after the last change — no
   * alert spam while typing, still a real sync (the save route revalidates).
   */
  const syncSettingsSoon = (next: AdminDB["settings"]): void => {
    window.clearTimeout(settingsTimer.current);
    /* Sanitize first — legacy keys must never reach the cloud upsert. */
    const clean = normalizeSettings(next);
    settingsTimer.current = window.setTimeout(() => {
      syncSave("settings", { id: "site", ...clean });
    }, 800);
  };

  /** Full-object settings replace from any tab — local instantly, cloud debounced. */
  const handleSettingsChange = (next: AdminDB["settings"]): void => {
    patch((d) => {
      d.settings = next;
    });
    syncSettingsSoon(next);
  };

  /**
   * Push the ENTIRE local DB to the cloud (services · skills · projects ·
   * certs · settings) — the rescue path for edits made while offline, and a
   * manual "make cloud == this screen" command. The server rebuilds after.
   */
  const doPushAll = async (): Promise<void> => {
    if (!CLOUD) {
      window.alert("Local workspace — cloud push is off. Data stays in this browser.");
      return;
    }
    const current = dbRef.current;
    if (!current) return;
    if (
      !window.confirm("Push EVERYTHING to the cloud? Cloud rows with the same ids get overwritten.")
    ) {
      return;
    }
    const payload = { ...current, settings: normalizeSettings(current.settings) };
    const res = await remoteSeed(payload).catch((e: unknown) => {
      syncFailed(e, "Push ");
      return null;
    });
    if (!res) return;
    setLastRefresh(res.at ?? Date.now());
    window.alert(
      `Pushed to cloud: ${res.seeded?.services ?? 0} services · ${res.seeded?.skills ?? 0} skills · ${res.seeded?.projects ?? 0} projects · ${res.seeded?.certs ?? 0} certs. Site rebuilt instantly.`,
    );
  };

  /** Pull the cloud snapshot over the local DB — "make this screen == cloud". */
  const doPullAll = async (): Promise<void> => {
    if (!CLOUD) {
      window.alert("Local workspace — cloud pull is off. Data stays in this browser.");
      return;
    }
    if (
      !window.confirm(
        "Replace local edits with the cloud snapshot? Unsynced local changes will be lost.",
      )
    ) {
      return;
    }
    let snap: Awaited<ReturnType<typeof fetchSnapshot>>;
    try {
      snap = await fetchSnapshot();
    } catch (e: unknown) {
      syncFailed(e, "Pull ");
      return;
    }
    const hasRows =
      snap.services.length + snap.skills.length + snap.projects.length + snap.certs.length > 0;
    if (!hasRows) {
      window.alert("Cloud is empty — nothing to pull. Push first.");
      return;
    }
    const prev = dbRef.current;
    const next = fromRemote({
      services: snap.services,
      skills: snap.skills,
      projects: snap.projects,
      certs: snap.certs,
      settings: snap.settings,
    });
    next.visitsBase = prev?.visitsBase ?? 0;
    next.visitsBump = prev?.visitsBump ?? 0;
    saveDB(next);
    setDb(next);
    setRemote({ visitsTotal: snap.visitsTotal, likes: snap.likes, synced: true, empty: false });
    window.alert("Pulled cloud snapshot — dashboard now mirrors the live site.");
  };

  /**
   * THE eye fix — visibility is REAL now: flip locally AND upsert the same
   * row to Supabase, so RLS (visible = true) hides it from the site within
   * a minute. Failures scream, never stay silent.
   */
  const toggleVisible = (
    kind: "services" | "skills" | "projects" | "certs",
    id: string,
  ): void => {
    let updated: unknown = null;
    setDb((prev) => {
      if (!prev) return prev;
      const next: AdminDB = JSON.parse(JSON.stringify(prev)) as AdminDB;
      const list = next[kind] as { id: string; visible: boolean; title?: string; name?: string; titleEn?: string }[];
      const item = list.find((x) => x.id === id);
      if (item) {
        item.visible = !item.visible;
        updated = item;
      }
      saveDB(next);
      return next;
    });
    window.setTimeout(() => {
      if (updated && CLOUD) {
        void remoteSave(kind, updated).catch((e: unknown) => {
          syncFailed(e, "Visibility saved locally — ");
        });
      }
    }, 0);
  };

  const duplicate = (
    kind: "services" | "skills" | "projects" | "certs",
    id: string,
  ): void => {
    let copy: unknown = null;
    setDb((prev) => {
      if (!prev) return prev;
      const next: AdminDB = JSON.parse(JSON.stringify(prev)) as AdminDB;
      const list = next[kind] as unknown as Record<string, unknown>[];
      const src = list.find((x) => (x as { id: string }).id === id) as
        | Record<string, unknown>
        | undefined;
      if (!src) return prev;
      const prefix = kind === "services" ? "srv" : kind === "skills" ? "skill" : kind === "projects" ? "proj" : "cert";
      copy = { ...src, id: uid(prefix), visible: false };
      const titleKey = "title" in src ? "title" : "name" in src ? "name" : "titleEn" in src ? "titleEn" : null;
      if (titleKey && typeof copy === "object" && copy !== null) {
        (copy as Record<string, unknown>)[titleKey] = `${String((src as Record<string, unknown>)[titleKey])} (copy)`;
      }
      (next[kind] as unknown[]).push(copy as never);
      saveDB(next);
      return next;
    });
    window.setTimeout(() => {
      if (copy) syncSave(kind, copy);
    }, 0);
  };

  /** Bulk: wipe / publish / hide a whole category — e.g. delete ALL frontend skills at once. */
  const bulkCategory = (
    kind: "services" | "skills" | "projects" | "certs",
    match: (item: never) => boolean,
    action: "delete" | "show" | "hide",
  ): void => {
    const current = dbRef.current;
    if (!current) return;
    const list = current[kind] as { id: string; visible: boolean }[];
    const targets = (list as never[]).filter(match);
    if (targets.length === 0) {
      window.alert("Nothing matches — nothing changed.");
      return;
    }
    if (action === "delete") {
      if (!window.confirm(`Delete ${targets.length} items permanently?${CLOUD ? " This hits the cloud too." : ""}`)) return;
      patch((d) => {
        d[kind] = ((d[kind] as unknown[]).filter(
          (x) => !(match(x as never)),
        ) as never[] as never) as never;
      });
      if (!CLOUD) return;
      for (const t of targets) {
        void remoteRemove(kind, (t as { id: string }).id).catch((e: unknown) => {
          syncFailed(e, "Deleted locally — ");
        });
      }
      return;
    }
    const visible = action === "show";
    patch((d) => {
      for (const x of d[kind] as unknown as { id: string; visible: boolean }[]) {
        if (match(x as never)) x.visible = visible;
      }
    });
    if (!CLOUD) return;
    for (const t of targets) {
      void remoteSave(kind, { ...(t as Record<string, unknown>), visible }).catch((e: unknown) => {
        syncFailed(e, "Saved locally — ");
      });
    }
  };

  if (!db) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0a0a0b]">
        <p className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">Loading…</p>
      </div>
    );
  }

  const liked = readLiked();
  const remoteLikes = remote?.likes ?? {};
  /** Per-project like totals for the Projects tab cards (cloud + this browser). */
  const likeMap: Record<string, number> = {};
  for (const p of db.projects) {
    const k = p.github || p.title;
    likeMap[k] = (remoteLikes[k] ?? 0) + (liked[k] ? 1 : 0);
  }
  const likesTotal = db.projects.reduce((sum, p) => {
    const k = p.github || p.title;
    return sum + (remoteLikes[k] ?? 0) + (liked[k] ? 1 : 0);
  }, 0);
  const localVisits = db.visitsBase + db.visitsBump + readVisits();
  const visits = remote ? remote.visitsTotal : localVisits;

  const counts: Record<Tab, number | null> = {
    home: null,
    services: db.services.length,
    skills: db.skills.length,
    projects: db.projects.length,
    certs: db.certs.length,
    settings: null,
  };

  /** Busted preview URL — recomputed every render, so the Hard button's
   *  nonce instantly swaps the iframe to a cache-free document. */
  const previewSrc = preview === null ? "" : bustPreview(preview, previewNonce);

  return (
    <div className="flex min-h-svh bg-[#0a0a0b] text-white">
      {/* Sidebar */}
      <aside className="fixed inset-x-0 top-0 z-[110] border-b border-white/10 bg-[#0a0a0b]/95 backdrop-blur-xl lg:inset-y-0 lg:right-auto lg:w-60 lg:border-r lg:border-b-0">
        <div className="group flex items-center gap-2.5 px-4 py-3 lg:px-5 lg:py-5">
          <span className="transition-all duration-500 group-hover:rotate-[-8deg] group-hover:drop-shadow-[0_0_14px_rgba(190,242,100,0.8)]">
            {workspaceLogo ? (
              <span className="relative block h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white">
                <SmartImage src={workspaceLogo} alt="" fill fit="contain" sizes="40px" />
              </span>
            ) : (
              <Logo />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-display truncate text-lg leading-none font-bold">
              {workspaceName ?? "BUDI"}
            </p>
            <p className="font-mono text-[9px] tracking-[0.3em] text-white/40 uppercase">
              Admin ·{" "}
              <span className={remote?.synced && !remote.empty ? "text-emerald-400" : "text-amber-300"}>
                {remote ? (remote.empty ? "Empty cloud DB" : remote.synced ? "Cloud ✓" : "Local only") : "Connecting…"}
              </span>
            </p>
          </div>
          <span className="ml-auto hidden rounded-md border border-[#bef264]/30 bg-[#bef264]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.2em] text-[#bef264] uppercase lg:block">
            v1
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-1.5 lg:px-3" aria-label="Admin">
          {TABS.map((item) => {
            const Icon = item.icon;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  tab === item.id
                    ? "bg-[#ff3d00] font-bold text-[#1a0e05]"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {count !== null && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 font-mono text-[10px] tabular-nums",
                      tab === item.id ? "bg-black/20" : "bg-white/10",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#ff3d00] to-[#ff7a00] px-3 py-2.5 text-sm font-black text-[#1a0e05] shadow-[0_8px_24px_-8px_rgba(255,61,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-8px_rgba(255,61,0,0.9)]"
          >
            <span
              aria-hidden="true"
              className="animate-bar-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            />
            <Globe className="relative h-4 w-4" aria-hidden="true" />
            <span className="relative">View site</span>
            <ExternalLink
              className="relative h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <button
            type="button"
            onClick={() => openPreview("/", true)}
            title="Open the full site in a fresh preview, bypassing the browser cache"
            className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-emerald-300/80 transition-colors hover:bg-emerald-400/10 hover:text-emerald-300"
          >
            <RefreshCcw className="h-4 w-4" />
            Fresh preview
          </button>
          <button
            type="button"
            onClick={doLogout}
            className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          {onSwitchAccount && (
            <button
              type="button"
              onClick={onSwitchAccount}
              title={workspaceName ? `Switch account (now in ${workspaceName})` : "Switch account"}
              className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Layers className="h-4 w-4" />
              Accounts
            </button>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="w-full px-4 pt-32 pb-10 sm:px-6 lg:pt-8 lg:pl-64">
        <div className="mx-auto max-w-5xl">
          {tab === "home" && (
            <HomeTab
              db={db}
              visits={visits}
              likesTotal={likesTotal}
              liked={liked}
              remoteLikes={remoteLikes}
              showSeed={remote?.empty === true}
              seeding={seeding}
              onSeed={doSeed}
              onTab={setTab}
              onPreview={openPreview}
              onHardPreview={openHardPreview}
              refreshing={refreshing}
              lastRefresh={lastRefresh}
              onRefreshNow={() => void doRevalidate()}
              onReset={() => setDb(resetDB())}
              onSettingsChange={handleSettingsChange}
            />
          )}
          {tab === "services" && (
            <ServicesTab
              db={db}
              onToggle={(id) => toggleVisible("services", id)}
              onDuplicate={(id) => duplicate("services", id)}
              onBulk={(match, action) => bulkCategory("services", match, action)}
              remove={(id) => remove("services", id)}
              onEdit={(item) => setEditing({ kind: "service", item })}
              onPreview={openPreview}
              onHardPreview={openHardPreview}
              refreshing={refreshing}
            />
          )}
          {tab === "skills" && (
            <SkillsTab
              db={db}
              onToggle={(id) => toggleVisible("skills", id)}
              onDuplicate={(id) => duplicate("skills", id)}
              onBulk={(match, action) => bulkCategory("skills", match, action)}
              remove={(id) => remove("skills", id)}
              onEdit={(item) => setEditing({ kind: "skill", item })}
              onPreview={openPreview}
              onHardPreview={openHardPreview}
              refreshing={refreshing}
            />
          )}
          {tab === "projects" && (
            <ProjectsTab
              db={db}
              onToggle={(id) => toggleVisible("projects", id)}
              onDuplicate={(id) => duplicate("projects", id)}
              onBulk={(match, action) => bulkCategory("projects", match, action)}
              remove={(id) => remove("projects", id)}
              onEdit={(item) => setEditing({ kind: "project", item })}
              onPreview={openPreview}
              onHardPreview={openHardPreview}
              refreshing={refreshing}
              likes={likeMap}
            />
          )}
          {tab === "certs" && (
            <CertsTab
              db={db}
              onToggle={(id) => toggleVisible("certs", id)}
              onDuplicate={(id) => duplicate("certs", id)}
              onBulk={(match, action) => bulkCategory("certs", match, action)}
              remove={(id) => remove("certs", id)}
              onEdit={(item) => setEditing({ kind: "cert", item })}
              onPreview={openPreview}
              onHardPreview={openHardPreview}
              refreshing={refreshing}
            />
          )}
          {tab === "settings" && (
            <SettingsTab
              db={db}
              patch={patch}
              onReset={() => {
                if (!window.confirm("Reset all dashboard data to site defaults?")) return;
                setDb(resetDB());
              }}
              onImport={(next) => setDb(next)}
              onSettingsSync={syncSettingsSoon}
              cloudOk={remote?.synced === true && remote.empty === false}
              lastRefresh={lastRefresh}
              onPushAll={doPushAll}
              onPullAll={doPullAll}
              onLogoutTab={doLogout}
              onPreviewSite={() => openPreview("/")}
            />
          )}
        </div>
      </main>

      {editing?.kind === "service" && (
        <ServiceEditor
          initial={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item, keepOpen) => {
            patch((d) => {
              const i = d.services.findIndex((s) => s.id === item.id);
              if (i >= 0) d.services[i] = item;
              else d.services.push(item);
            });
            syncSave("services", item);
            if (!keepOpen) setEditing(null);
          }}
        />
      )}
      {editing?.kind === "skill" && (
        <SkillEditor
          initial={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item, keepOpen) => {
            patch((d) => {
              const i = d.skills.findIndex((s) => s.id === item.id);
              if (i >= 0) d.skills[i] = item;
              else d.skills.push(item);
            });
            syncSave("skills", item);
            if (!keepOpen) setEditing(null);
          }}
        />
      )}
      {editing?.kind === "project" && (
        <ProjectEditor
          initial={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item, keepOpen) => {
            patch((d) => {
              const i = d.projects.findIndex((p) => p.id === item.id);
              if (i >= 0) d.projects[i] = item;
              else d.projects.push(item);
            });
            syncSave("projects", item);
            if (!keepOpen) setEditing(null);
          }}
        />
      )}
      {editing?.kind === "cert" && (
        <CertEditor
          initial={editing.item}
          onClose={() => setEditing(null)}
          onSave={(item, keepOpen) => {
            patch((d) => {
              const i = d.certs.findIndex((c) => c.id === item.id);
              if (i >= 0) d.certs[i] = item;
              else d.certs.push(item);
            });
            syncSave("certs", item);
            if (!keepOpen) setEditing(null);
          }}
        />
      )}

      {preview !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site preview"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-pop relative my-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#101012] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(255,61,0,0.25)]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff3d00] to-transparent"
            />
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[0_0_8px_rgba(255,95,87,0.6)]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[0_0_8px_rgba(254,188,46,0.6)]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_8px_rgba(40,200,64,0.6)]" />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0 text-[#bef264]" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/70">
                  {previewSrc || preview}
                </span>
                {previewNonce > 0 && (
                  <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.18em] text-emerald-300 uppercase">
                    Fresh
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={hardReloadPreview}
                  disabled={refreshing}
                  title="Rebuild the live site from Supabase, then reload this frame — a REAL hard refresh"
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-mono text-[11px] font-bold text-emerald-300 uppercase transition-all hover:bg-emerald-400/20 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCcw
                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                    aria-hidden="true"
                  />
                  {refreshing ? "Rebuilding…" : "Hard"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Close preview"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/60 transition-all hover:rotate-90 hover:border-[#ff3d00] hover:text-[#ff3d00]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            </div>
            {/* Live status strip */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {preview === "/" ? "Full site" : `#${preview.replace("/#", "")}`}
              </span>
              <span className="truncate text-white/40 tabular-nums" aria-live="polite">
                {refreshing
                  ? "Rebuilding site…"
                  : lastRefresh
                    ? `Site rebuilt · ${new Date(lastRefresh).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                    : "Auto-rebuilds on every save"}
              </span>
            </div>
            <iframe
              key={previewSrc}
              title="Site preview"
              src={previewSrc}
              className="block h-[62vh] w-full bg-[#0a0a0b] sm:h-[68vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Live availability pill — mirrors every site badge from the same switch. */
function AvailabilityPill({
  db,
  onManage,
}: {
  db: AdminDB;
  onManage: () => void;
}): React.JSX.Element {
  const avail = availabilityFromSettings(db.settings);
  const live = avail.status === "available" && !db.settings.maintenance;
  const label = db.settings.maintenance
    ? "Maintenance mode"
    : workLabel(avail, "en", { available: "Open for work", unavailable: "Unavailable" });
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase">
      <span className={cn("flex items-center gap-1.5", live ? "text-emerald-400" : "text-amber-300")}>
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "animate-ping-soft absolute inline-flex h-full w-full rounded-full",
              live ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              live ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
        </span>
        <span className="max-w-56 truncate" title={label}>
          {label}
        </span>
      </span>
      <button
        type="button"
        onClick={onManage}
        className="cursor-pointer text-white/35 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
      >
        Manage
      </button>
    </p>
  );
}

/* --------------------------------- home --------------------------------- */

/** Rotating Quranic verse — the dashboard mirror of the site footer's daily verse. */
function VerseRotator(): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % VERSES.length);
        setVisible(true);
      }, 300);
    }, 8000);
    return (): void => {
      window.clearInterval(id);
    };
  }, [paused]);

  const v = VERSES[index] ?? VERSES[0]!;

  return (
    <figure
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.07] via-transparent to-[#ff3d00]/[0.07] p-6 text-center lg:col-span-3"
    >
      <Quote className="mx-auto h-5 w-5 text-[#d7fd44]" aria-hidden="true" />
      <div className={cn("transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}>
        <blockquote dir="rtl" lang="ar" className="mt-2 text-xl leading-loose text-white sm:text-2xl">
          {v.ar}
        </blockquote>
        <figcaption className="mt-2 text-xs leading-relaxed text-white/60 italic">
          &ldquo;{v.en}&rdquo; —{" "}
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase not-italic">{v.ref}</span>
        </figcaption>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5" role="group" aria-label="Verses">
        {VERSES.map((verse, i) => (
          <button
            key={verse.ref}
            type="button"
            onClick={() => {
              setIndex(i);
              setVisible(true);
            }}
            aria-label={`Show ${verse.ref}`}
            aria-pressed={i === index}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all duration-300",
              i === index ? "w-6 bg-[#d7fd44]" : "w-1.5 bg-white/20 hover:bg-white/40",
            )}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[9px] tracking-[0.22em] text-white/30 uppercase">
        {index + 1}/{VERSES.length} · rotates on the site daily · hover to pause
      </p>
    </figure>
  );
}

/** Live birthday countdown — ticks every second toward 24 October. */
function BirthdayCountdown(): React.JSX.Element {
  // Null until mounted: server and first paint render placeholders,
  // so the live clock can never cause a hydration mismatch.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return (): void => {
      window.clearInterval(id);
    };
  }, []);

  const [by, bm, bd] = (personal.birthdate ?? "").split("-").map(Number);
  const now = nowMs === null ? null : new Date(nowMs);
  let target: Date | null = null;
  let isToday = false;
  if (now && by && bm && bd) {
    const sameDay = now.getMonth() === bm - 1 && now.getDate() === bd;
    isToday = sameDay;
    target = new Date(now.getFullYear(), bm - 1, bd);
    if (!sameDay && target.getTime() <= now.getTime()) {
      target = new Date(now.getFullYear() + 1, bm - 1, bd);
    }
  }
  const turning = target && by ? target.getFullYear() - by : 0;
  const diff = target && now && !isToday ? Math.max(target.getTime() - now.getTime(), 0) : 0;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const num = (n: number): string => (nowMs === null ? "––" : String(n).padStart(2, "0"));
  const dayNum = (n: number): string => (nowMs === null ? "––" : String(n));

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-300/[0.08] via-transparent to-rose-400/[0.08] p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 90% 10%, rgba(251,191,36,0.12), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-rose-400 text-black shadow-[0_0_32px_rgba(251,191,36,0.45)]">
          <Cake className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-200/80 uppercase">
            Birthday countdown · 24 October
          </p>
          <p className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">
            {isToday && nowMs !== null ? (
              <>It&apos;s today — Mohamed turns {turning}!</>
            ) : (
              <>Mohamed turns {turning} in…</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-stretch gap-1.5" role="timer" aria-label="Time until birthday">
          {[
            { v: dayNum(days), l: "Days" },
            { v: num(hours), l: "Hrs" },
            { v: num(mins), l: "Min" },
            { v: num(secs), l: "Sec" },
          ].map((u) => (
            <div key={u.l} className="flex min-w-[3.4rem] flex-col items-center rounded-xl border border-white/10 bg-black/40 px-2 py-2">
              <span className="font-display text-xl font-black text-amber-200 tabular-nums sm:text-2xl">
                {u.v}
              </span>
              <span className="font-mono text-[8px] tracking-[0.22em] text-white/45 uppercase">{u.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeTab({
  db,
  visits,
  likesTotal,
  liked,
  remoteLikes,
  showSeed,
  seeding,
  onSeed,
  onTab,
  onPreview,
  onHardPreview,
  refreshing,
  lastRefresh,
  onRefreshNow,
  onReset,
  onSettingsChange,
}: {
  db: AdminDB;
  visits: number;
  likesTotal: number;
  liked: Record<string, boolean>;
  remoteLikes: Record<string, number>;
  showSeed: boolean;
  seeding: boolean;
  onSeed: () => void;
  onTab: (t: Tab) => void;
  onPreview: (href: string) => void;
  onHardPreview: (href: string) => void;
  refreshing: boolean;
  lastRefresh: number | null;
  onRefreshNow: () => void;
  onReset: () => void;
  onSettingsChange: (next: AdminDB["settings"]) => void;
}): React.JSX.Element {
  const monitor = useSecurityMonitor(db);
  const dbBytes = useMemo(() => {
    try {
      return new Blob([JSON.stringify(db)]).size;
    } catch {
      return 0;
    }
  }, [db]);
  const dbKb = (dbBytes / 1024).toFixed(1);

  const sections = useMemo(
    () => [
      { id: "services" as Tab, label: "Services", total: db.services.length, color: "#38bdf8", icon: Briefcase, href: "/#services" },
      { id: "skills" as Tab, label: "Skills", total: db.skills.length, color: "#d7fd44", icon: Cpu, href: "/#skills" },
      { id: "projects" as Tab, label: "Projects", total: db.projects.length, color: "#ff3d00", icon: FolderGit, href: "/#projects" },
      { id: "certs" as Tab, label: "Certificates", total: db.certs.length, color: "#a78bfa", icon: Award, href: "/#certificates" },
    ],
    [db],
  );
  const visibleOf = (id: Tab): number =>
    id === "services"
      ? db.services.filter((s) => s.visible).length
      : id === "skills"
        ? db.skills.filter((s) => s.visible).length
        : id === "projects"
          ? db.projects.filter((p) => p.visible).length
          : db.certs.filter((c) => c.visible).length;
  const totalItems = sections.reduce((n, s) => n + s.total, 0);
  const visibleItems = sections.reduce((n, s) => n + visibleOf(s.id), 0);
  const score = totalItems === 0 ? 0 : Math.round((visibleItems / totalItems) * 100);
  const likedProjects = db.projects.filter((p) => liked[p.github || p.title]);

  /** Skills leaderboard — hearts from this browser, usage from the DB, blended score. */
  const skillLiked = readSkillLiked();
  const skillRows = db.skills
    .map((s) => {
      const refs = db.projects.map((p) => ({ title: p.title, tech: p.tech, visible: p.visible }));
      return {
        skill: s,
        usage: skillProjectUsage(s.name, s.level, refs),
        likes: skillLiked[s.name] ? 1 : 0,
      };
    })
    .sort((a, b) => b.usage.score - a.usage.score || b.skill.level - a.skill.level);

  const quotaMb = monitor.quota
    ? `${(monitor.quota.usage / 1048576).toFixed(2)} / ${(monitor.quota.quota / 1048576).toFixed(0)} MB`
    : "measuring…";
  const allOk = monitor.checks.length > 0 && monitor.checks.every((c) => c.ok) && monitor.trapped === 0;

  /** Badges command helpers — full-object settings writes via one funnel. */
  const setWork = (p: Partial<AdminSettings>): void =>
    onSettingsChange({ ...db.settings, ...p });
  const workAvail = availabilityFromSettings(db.settings);
  const workLive = workAvail.status === "available";
  const workDate = formatBadgeDate(db.settings.workUntil, "en");
  const workHeadline = workLive
    ? "Available for work"
    : (db.settings.workNote.trim() || "Not available") + (workDate ? ` · Back ${workDate}` : "");
  const setRailState = (key: "vodafone" | "taptap" | "instapay", v: RailState): void => {
    if (key === "vodafone") setWork({ vodafoneState: v });
    else if (key === "taptap") setWork({ taptapState: v });
    else setWork({ instapayState: v });
  };
  const setRailAt = (key: "vodafone" | "taptap" | "instapay", v: string): void => {
    if (key === "vodafone") setWork({ vodafoneAt: v });
    else if (key === "taptap") setWork({ taptapAt: v });
    else setWork({ instapayAt: v });
  };
  const rails = [
    { key: "vodafone", label: "Vodafone Cash", logo: "/icons/vodafone.svg" },
    { key: "taptap", label: "TapTap Send", logo: "/icons/taptapsend.png" },
    { key: "instapay", label: "InstaPay", logo: "/icons/InstaPay.png" },
  ] as const;
  const railOf = (
    key: "vodafone" | "taptap" | "instapay",
  ): { state: RailState; account: string; at: string } =>
    key === "vodafone"
      ? { state: db.settings.vodafoneState, account: db.settings.vodafoneNumber, at: db.settings.vodafoneAt }
      : key === "taptap"
        ? { state: db.settings.taptapState, account: db.settings.vodafoneNumber, at: db.settings.taptapAt }
        : { state: db.settings.instapayState, account: db.settings.instapayHandle, at: db.settings.instapayAt };

  return (
    <div>
      {showSeed && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/[0.07] p-5 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10">
            <Database className="h-5 w-5 text-amber-300" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-200">Cloud database is empty</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
              Push this dashboard&apos;s content (services · skills · projects · certs · settings) to Supabase once — the site reads it live from there.
            </p>
          </div>
          <button
            type="button"
            onClick={onSeed}
            disabled={seeding}
            className="shrink-0 cursor-pointer bg-amber-400 px-5 py-2.5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {seeding ? "Seeding…" : "Seed database"}
          </button>
        </div>
      )}
      {/* Badges command — every site badge driven from here */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.06] via-transparent to-[#ff3d00]/[0.06] p-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#d7fd44] to-transparent"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#d7fd44]/80 uppercase">
              Badges command · site-wide switches
            </p>
            <h3 className="font-display mt-1 text-2xl font-black tracking-tight">
              Every badge, one place
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onTab("settings")}
            className="cursor-pointer rounded-xl border border-white/15 px-4 py-2.5 font-mono text-[11px] text-white/60 uppercase transition-colors hover:border-[#ff3d00]/60 hover:text-[#ff3d00]"
          >
            Full editors
          </button>
        </div>

        {/* Work master switch */}
        <div className="relative mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={cn(
                  "animate-ping-soft absolute inline-flex h-full w-full rounded-full",
                  workLive ? "bg-emerald-400" : "bg-amber-400",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-3 w-3 rounded-full",
                  workLive ? "bg-emerald-400" : "bg-amber-400",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black" title={workHeadline}>
                {workHeadline}
              </p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">
                Master switch · navbar · footer · about · contact · console
              </p>
            </div>
            <div
              className="flex w-full shrink-0 rounded-xl border border-white/15 bg-black/40 p-1 sm:w-72"
              role="group"
              aria-label="Work availability master switch"
            >
              <button
                type="button"
                onClick={() => setWork({ workStatus: "available" })}
                aria-pressed={workLive}
                className={cn(
                  "flex-1 cursor-pointer rounded-lg px-3 py-2.5 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all",
                  workLive
                    ? "bg-emerald-400 text-black shadow-[0_0_18px_rgba(52,211,153,0.5)]"
                    : "text-white/40 hover:text-white",
                )}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setWork({ workStatus: "unavailable" })}
                aria-pressed={!workLive}
                className={cn(
                  "flex-1 cursor-pointer rounded-lg px-3 py-2.5 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all",
                  !workLive
                    ? "bg-amber-300 text-black shadow-[0_0_18px_rgba(252,211,77,0.5)]"
                    : "text-white/40 hover:text-white",
                )}
              >
                Busy
              </button>
            </div>
          </div>
          {!workLive && (
            <div className="mt-3 grid items-end gap-2 border-t border-white/10 pt-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                  Why
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {NOTE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onSettingsChange({ ...db.settings, workNote: p.en, workNoteFr: p.fr })
                      }
                      aria-pressed={db.settings.workNote === p.en}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.1em] uppercase transition-all",
                        db.settings.workNote === p.en
                          ? "border-[#ff3d00] bg-[#ff3d00] text-[#1a0e05]"
                          : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/30 hover:text-white",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <DeadlineInput
                label="Back on"
                value={db.settings.workUntil}
                onChange={(v) => setWork({ workUntil: v })}
              />
            </div>
          )}
        </div>

        {/* Payment rails quick control */}
        <div className="relative mt-3 grid gap-2 lg:grid-cols-3">
          {rails.map((rail) => {
            const r = railOf(rail.key);
            const railDate = formatBadgeDate(r.at, "en");
            return (
              <div key={rail.key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
                    <Image
                      src={rail.logo}
                      alt=""
                      width={48}
                      height={20}
                      className="block object-contain"
                      style={{ width: "auto", height: "20px" }}
                    />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold">{rail.label}</p>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      r.state === "active"
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                        : r.state === "soon"
                          ? "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                          : "bg-white/25",
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2.5">
                  <TriState value={r.state} onPick={(v) => setRailState(rail.key, v)} />
                </div>
                {r.state === "soon" && (
                  <div className="mt-2">
                    <DeadlineInput
                      label="Available on"
                      value={r.at}
                      onChange={(v) => setRailAt(rail.key, v)}
                    />
                  </div>
                )}
                <p className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-white/40">
                  <span className="truncate tabular-nums" dir="ltr">
                    {r.account || "—"}
                    {railDate !== "" && r.state === "soon" ? ` · ${railDate}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => onTab("settings")}
                    className="shrink-0 cursor-pointer uppercase underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                  >
                    Edit
                  </button>
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Identity + verse */}
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff3d00] to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(255,61,0,0.14), transparent 65%)",
            }}
          />
          <p className="relative mb-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-[#ff3d00] uppercase">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
            Command console
          </p>
          <div className="relative flex items-center gap-4">
            <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ff3d00]/50 shadow-[0_0_28px_rgba(255,61,0,0.35)]">
              <Image
                src="/images/profile/contact.jpg"
                alt="Mohamed Abdallah"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0">
              <p className="font-display truncate text-2xl font-bold">Mohamed Abdallah</p>
              <p className="mt-0.5 font-mono text-[10px] tracking-[0.24em] text-[#ff3d00] uppercase">
                Full-Stack Developer
              </p>
              <AvailabilityPill db={db} onManage={() => onTab("settings")} />
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
            {[
              { n: totalItems, l: "Items" },
              { n: visibleItems, l: "Live" },
              { n: score, l: "Score %" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg bg-black/30 px-2 py-2.5">
                <p className="font-display text-2xl font-black tabular-nums">{s.n}</p>
                <p className="font-mono text-[9px] tracking-[0.22em] text-white/45 uppercase">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <VerseRotator />
      </div>

      <BirthdayCountdown />

      {/* Quick counters */}
      <h3 className="font-display mt-8 text-lg font-bold">Quick stats</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} value={visits} label="Visitors" accent />
        <StatCard icon={Heart} value={likesTotal} label="Project likes" color="#fb7185" />
        <StatCard icon={Eye} value={visibleItems} label="Live items" color="#d7fd44" />
        <StatCard icon={Database} value={totalItems} label="Items in DB" />
      </div>

      {/* Site progress per section */}
      <h3 className="font-display mt-8 text-lg font-bold">Site progress</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => {
          const vis = visibleOf(s.id);
          const pct = s.total === 0 ? 0 : Math.round((vis / s.total) * 100);
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onTab(s.id)}
              className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-[#ff3d00]/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${s.color}1f`, color: s.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline justify-between text-sm font-bold">
                    {s.label}
                    <span className="font-mono text-[11px] text-white/55 tabular-nums">
                      {vis}/{s.total} · {pct}%
                    </span>
                  </p>
                  <div className="mt-2">
                    <Bar pct={pct} color={s.color} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Security + integrity monitor */}
      <h3 className="font-display mt-8 flex items-center gap-2 text-lg font-bold">
        <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        Security & integrity monitor
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.18em] uppercase",
            allOk
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              : "border-amber-400/40 bg-amber-400/10 text-amber-300",
          )}
        >
          {allOk ? "Shielded" : "Attention"}
        </span>
      </h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {monitor.checks.map((c) => (
          <HealthRow key={c.key} ok={c.ok} label={labelOfCheck(c.key)} sub={c.detail} />
        ))}
        <HealthRow
          ok={monitor.trapped === 0}
          label="Error trap"
          sub={
            monitor.trapped === 0
              ? "0 runtime errors trapped · Sentry armed"
              : `${monitor.trapped} error(s) trapped · last: ${(monitor.lastError ?? "").slice(0, 60)}`
          }
        />
        <HealthRow ok label="Storage quota" sub={quotaMb} />
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-white/35 uppercase">
        Local self-checks + runtime trap reported via Sentry · backend rules plug in here
      </p>

      {/* Likes per project */}
      <h3 className="font-display mt-8 text-lg font-bold">Likes per project</h3>
      <div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
        {db.projects.map((p) => {
          const k = p.github || p.title;
          const isLoved = !!liked[k];
          const count = (remoteLikes[k] ?? 0) + (isLoved ? 1 : 0);
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <Heart
                className={cn("h-4 w-4", isLoved ? "fill-[#ff3d00] text-[#ff3d00]" : "text-white/25")}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
              {!p.visible && (
                <span className="font-mono text-[10px] text-white/30 uppercase">hidden</span>
              )}
              <span className="font-mono text-xs text-white/60 tabular-nums">
                {count}
              </span>
            </div>
          );
        })}
        {likedProjects.length === 0 && (
          <p className="px-4 py-3 font-mono text-[11px] text-white/35">
            No likes from this browser yet — like a project on the site to see it here.
          </p>
        )}
      </div>

      {/* Skills leaderboard — likes · usage · score, mirrored from the site */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Skills leaderboard</h3>
        <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Hearts this browser · projects in DB · blended score
        </p>
      </div>
      <div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
        {skillRows.map((row, i) => {
          const tag = levelTag(row.skill.level);
          const color = LEVEL_COLOR[levelKeyOf(row.skill.level)] ?? "#d7fd44";
          return (
            <div key={row.skill.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-7 shrink-0 font-mono text-xs text-white/35 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="flex h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.skill.name}</span>
              <span
                className="hidden shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase sm:block"
                style={{ borderColor: `${color}55`, color }}
              >
                {tag} {row.skill.level}
              </span>
              <span
                title={(row.usage.projects ?? []).join(" · ") || "No linked project yet"}
                className="flex shrink-0 cursor-help items-center gap-1 font-mono text-[11px] text-white/55 tabular-nums"
              >
                <FolderGit className="h-3.5 w-3.5" aria-hidden="true" />
                {row.usage.count}
              </span>
              <span
                title="Showcase score = mastery + project proof"
                className="flex shrink-0 items-center gap-1 font-mono text-[11px] font-bold text-white tabular-nums"
              >
                <Star className="h-3.5 w-3.5 text-[#d7fd44]" aria-hidden="true" />
                {row.usage.score}
              </span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] tabular-nums">
                <Heart
                  className={cn("h-3.5 w-3.5", row.likes > 0 ? "fill-[#fb7185] text-[#fb7185]" : "text-white/25")}
                  aria-hidden="true"
                />
                <span className={row.likes > 0 ? "text-[#fb7185]" : "text-white/40"}>{row.likes}</span>
              </span>
            </div>
          );
        })}
        {skillRows.length === 0 && (
          <p className="px-4 py-3 font-mono text-[11px] text-white/35">
            No skills yet — add one in the Skills tab.
          </p>
        )}
      </div>

      {/* Database card */}
      <h3 className="font-display mt-8 text-lg font-bold">Database</h3>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30">
          <HardDrive className="h-5 w-5 text-white/60" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            budi-admin-db · v{db.version} · {dbKb} KB
          </p>
          <p className="font-mono text-[10px] tracking-[0.16em] text-white/40 uppercase">
            localStorage-backed · validated with zod · Supabase owns visits & likes next
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Reset all dashboard data to site defaults?")) return;
              onReset();
            }}
            className="flex cursor-pointer items-center gap-1.5 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Site refresh command — the REAL hard refresh, with proof */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#bef264]/25 bg-gradient-to-br from-[#bef264]/[0.07] via-transparent to-[#ff3d00]/[0.08] p-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#bef264] to-transparent"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#bef264]/40 bg-[#bef264]/10 shadow-[0_0_28px_rgba(190,242,100,0.3)]">
            <Zap className="h-7 w-7 text-[#bef264]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#bef264]/80 uppercase">
              Site refresh · real hard rebuild
            </p>
            <p className="font-display mt-1 text-xl font-bold text-white" aria-live="polite">
              {refreshing
                ? "Rebuilding the live site…"
                : lastRefresh
                  ? `Last rebuilt · ${new Date(lastRefresh).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Every save rebuilds the site automatically"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Hard purges the server cache and rebuilds from Supabase — then open any preview below to see it live.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshNow}
            disabled={refreshing}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#bef264] px-6 py-3.5 text-sm font-black text-[#101200] shadow-[0_12px_32px_-12px_rgba(190,242,100,0.7)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
            {refreshing ? "Rebuilding…" : "Refresh site now"}
          </button>
        </div>
      </div>

      {/* Live preview — every section, soft open or real hard rebuild */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Live preview</h3>
        <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Eye opens · Hard rebuilds first, then opens
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PreviewRow
          label="Full site"
          meta="everything · /"
          icon={LayoutDashboard}
          color="#ff3d00"
          onOpen={() => onPreview("/")}
          onHard={() => onHardPreview("/")}
          refreshing={refreshing}
        />
        {sections.map((s) => (
          <PreviewRow
            key={s.id}
            label={`${s.label} section`}
            meta={`${s.total} items · ${s.href}`}
            icon={s.icon}
            color={s.color}
            onOpen={() => onPreview(s.href)}
            onHard={() => onHardPreview(s.href)}
            onEdit={() => onTab(s.id)}
            refreshing={refreshing}
          />
        ))}
        <PreviewRow
          label="Contact section"
          meta="get in touch · /#contact"
          icon={Globe}
          color="#38bdf8"
          onOpen={() => onPreview("/#contact")}
          onHard={() => onHardPreview("/#contact")}
          refreshing={refreshing}
        />
      </div>
    </div>
  );
}

function labelOfCheck(key: string): string {
  switch (key) {
    case "storage":
      return "Storage";
    case "database":
      return "Database";
    case "session":
      return "Admin session";
    case "network":
      return "Network";
    case "transport":
      return "Transport";
    default:
      return key;
  }
}

function HealthRow({ ok, label, sub }: { ok: boolean | null; label: string; sub: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full",
            ok === null ? "bg-white/30" : ok ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            ok === null ? "bg-white/30" : ok ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase">{sub}</p>
      </div>
      <span
        className={cn(
          "ml-auto shrink-0 font-mono text-[10px] tracking-[0.2em] uppercase",
          ok === null ? "text-white/40" : ok ? "text-emerald-400" : "text-amber-400",
        )}
      >
        {ok === null ? "—" : ok ? "Live" : "Standby"}
      </span>
    </div>
  );
}

/** Live preview card — soft open, REAL hard rebuild, optional edit jump. */
function PreviewRow({
  label,
  meta,
  icon: Icon,
  color,
  onOpen,
  onHard,
  onEdit,
  refreshing,
}: {
  label: string;
  meta: string;
  icon: typeof LayoutDashboard;
  color: string;
  onOpen: () => void;
  onHard: () => void;
  onEdit?: () => void;
  refreshing: boolean;
}): React.JSX.Element {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
        style={{ background: color, boxShadow: `0 0 16px ${color}` }}
      />
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          style={{ backgroundColor: `${color}1a`, borderColor: `${color}44`, color }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{label}</p>
          <p className="truncate font-mono text-[10px] tracking-[0.08em] text-white/40">{meta}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <button
          type="button"
          onClick={onOpen}
          title={`Preview ${label}`}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-bold transition-all hover:border-[#ff3d00]/60 hover:text-[#ff3d00]"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Open
        </button>
        <button
          type="button"
          onClick={onHard}
          disabled={refreshing}
          title={`Rebuild the live site from Supabase, then open ${label} fresh`}
          aria-label={`Hard rebuild and preview ${label}`}
          className="flex cursor-pointer items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] px-3.5 py-2.5 text-emerald-300 transition-all hover:bg-emerald-400/15 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCcw
            className={cn("h-4 w-4", refreshing && "animate-spin")}
            aria-hidden="true"
          />
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title={`Edit ${label} content`}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2.5 font-mono text-[11px] text-white/60 uppercase transition-colors hover:border-[#ff3d00]/60 hover:text-[#ff3d00]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- lists --------------------------------- */

/** Compact sort control shared by every section toolbar. */
function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}): React.JSX.Element {
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3 transition-colors focus-within:border-[#ff3d00]/60">
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort items"
        className="cursor-pointer bg-transparent font-mono text-[11px] text-white/80 uppercase outline-none [&>option]:bg-[#131316]"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Section shell — command header for every content section: animated total
 *  counter, live-coverage bar, one-tap site preview (soft + real hard
 *  rebuild), an upgraded Add command, and a slot for the category
 *  inventory grid. One upgrade here lifts all four sections at once. */
function ListShell({
  title,
  sub,
  live,
  hidden,
  accent = "#ff3d00",
  icon,
  stat,
  previewHref,
  onPreview,
  onHardPreview,
  refreshing,
  onAdd,
  addLabel,
  toolbar,
  inventory,
  children,
}: {
  title: string;
  sub: string;
  live?: number;
  hidden?: number;
  accent?: string;
  icon?: typeof LayoutDashboard;
  stat?: string;
  previewHref?: string;
  onPreview?: (href: string) => void;
  onHardPreview?: (href: string) => void;
  refreshing?: boolean;
  onAdd: () => void;
  addLabel: string;
  toolbar?: React.ReactNode;
  inventory?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  const total = (live ?? 0) + (hidden ?? 0);
  const shown = useCountUp(total);
  const pct = total === 0 ? 0 : Math.round(((live ?? 0) / total) * 100);
  const Icon = icon;
  const canPreview = previewHref !== undefined && onPreview !== undefined && onHardPreview !== undefined;
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 55%)` }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent"
          style={{ color: accent }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {Icon && (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: `${accent}1f`,
                  borderColor: `${accent}55`,
                  color: accent,
                  boxShadow: `0 0 28px ${accent}44`,
                }}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
                {title}{" "}
                <span style={{ color: accent, textShadow: `0 0 18px ${accent}66` }}>{shown}</span>
              </h2>
              <p className="mt-1.5 font-mono text-[11px] tracking-[0.22em] text-white/45 uppercase">
                {sub}
              </p>
              {typeof live === "number" && (
                <p className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {live} live
                  </span>
                  {typeof hidden === "number" && hidden > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] font-bold text-white/45 uppercase">
                      <EyeOff className="h-3 w-3" />
                      {hidden} hidden
                    </span>
                  )}
                  {stat && (
                    <span className="font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase">
                      · {stat}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canPreview && (
              <>
                <button
                  type="button"
                  onClick={() => onPreview?.(previewHref as string)}
                  title={`Preview ${title} on the live site`}
                  aria-label={`Preview ${title} section`}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff3d00] hover:text-[#ff3d00]"
                >
                  <Eye className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onHardPreview?.(previewHref as string)}
                  disabled={refreshing}
                  title={`Rebuild the site, then preview ${title} fresh — real hard refresh`}
                  aria-label={`Hard rebuild and preview ${title} section`}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/[0.07] text-emerald-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400/15 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCcw
                    className={cn("h-5 w-5", refreshing && "animate-spin")}
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onAdd}
              className="group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-black shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: accent, color: "#140b04", boxShadow: `0 12px 32px -12px ${accent}88` }}
            >
              <span
                aria-hidden="true"
                className="animate-bar-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
              <Plus className="relative h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              <span className="relative">{addLabel}</span>
            </button>
          </div>
        </div>
        {typeof live === "number" && (
          <div className="relative mt-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase tabular-nums">
              <span>Live coverage</span>
              <span>
                {live}/{total} · {pct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                  boxShadow: `0 0 12px ${accent}66`,
                }}
              />
            </div>
          </div>
        )}
        {toolbar && <div className="relative mt-5 flex flex-col gap-3">{toolbar}</div>}
        {inventory}
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </div>
  );
}

/** Category inventory — every group at a glance: counts, live bar, and full
 *  control (filter · add inside · publish all · hide all · delete group).
 *  Shared by all four sections so classification works identically. */
function InventoryGrid<T extends string>({
  title,
  groups,
  active,
  onFilter,
  onAddIn,
  onBulk,
}: {
  title: string;
  groups: { id: T; label: string; color: string; total: number; live: number; extra?: string }[];
  active: T | "all";
  onFilter: (id: T | "all") => void;
  onAddIn: (id: T) => void;
  onBulk: (id: T, action: "delete" | "show" | "hide") => void;
}): React.JSX.Element | null {
  if (groups.length === 0) return null;
  return (
    <div className="relative mt-5">
      <p className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
        <Layers className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
        {title} — inventory
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {groups.map((g) => {
          const isActive = active === g.id;
          const pct = g.total === 0 ? 0 : Math.round((g.live / g.total) * 100);
          return (
            <div
              key={g.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                isActive
                  ? "border-white/30 bg-white/[0.05]"
                  : "border-white/10 bg-black/25 hover:border-white/20",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: g.color, boxShadow: `0 0 10px ${g.color}` }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => onFilter(isActive ? "all" : g.id)}
                  title={isActive ? "Show all" : `Filter to ${g.label}`}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-bold transition-colors hover:text-white"
                >
                  {g.label}
                </button>
                {g.extra && (
                  <span className="shrink-0 font-mono text-[10px] text-white/40">{g.extra}</span>
                )}
                <span className="shrink-0 font-mono text-[11px] text-white/60 tabular-nums">
                  {g.live}/{g.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: g.color }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddIn(g.id)}
                  title={`Add a new item in ${g.label}`}
                  className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.08em] text-white/70 uppercase transition-colors hover:border-white/40 hover:text-white"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => onBulk(g.id, "show")}
                  title={`Publish every item in ${g.label}`}
                  className="cursor-pointer rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.08em] text-emerald-300 uppercase transition-colors hover:bg-emerald-400/20"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => onBulk(g.id, "hide")}
                  title={`Hide every item in ${g.label}`}
                  className="cursor-pointer rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.08em] text-amber-300 uppercase transition-colors hover:bg-amber-400/20"
                >
                  Hide
                </button>
                <button
                  type="button"
                  onClick={() => onBulk(g.id, "delete")}
                  title={`Delete every item in ${g.label} (cloud too)`}
                  className="cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.08em] text-red-400 uppercase transition-colors hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RowActions({
  visible,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  visible: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        title={visible ? "REAL hide — removes from the site (cloud sync)" : "Publish — shows on the site (cloud sync)"}
        aria-label={visible ? "Hide from site (real)" : "Show on site (real)"}
        className={cn(
          "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5",
          visible
            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.25)] hover:bg-emerald-400/20"
            : "border-amber-400/40 bg-amber-400/[0.07] text-amber-300 hover:bg-amber-400/15",
        )}
      >
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        title="Edit"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff3d00] hover:text-[#ff3d00]"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {onDuplicate && (
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate (starts hidden)"
          title="Duplicate (starts hidden)"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-300"
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete permanently (cloud too)"
        title="Delete permanently (cloud too)"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormErrors({ errors }: { errors: string[] }): React.JSX.Element | null {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/[0.08] p-4">
      <p className="mb-1.5 font-mono text-[10px] font-black tracking-[0.2em] text-red-400 uppercase">
        Fix {errors.length} {errors.length === 1 ? "issue" : "issues"} to save
      </p>
      {errors.map((e) => (
        <p key={e} className="text-xs leading-relaxed text-red-300">
          • {e}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------- services ------------------------------- */

function ServicesTab({
  db,
  remove,
  onEdit,
  onToggle,
  onDuplicate,
  onBulk,
  onPreview,
  onHardPreview,
  refreshing,
}: {
  db: AdminDB;
  remove: (id: string) => void;
  onEdit: (item: AdminService | null) => void;
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulk: (match: (item: never) => boolean, action: "delete" | "show" | "hide") => void;
  onPreview: (href: string) => void;
  onHardPreview: (href: string) => void;
  refreshing: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ServiceCategory | "all">("all");
  const [sort, setSort] = useState<"curated" | "az" | "rich">("curated");
  const q = query.trim().toLowerCase();
  const filtered = db.services.filter(
    (s) =>
      (cat === "all" || s.category === cat) &&
      (q === "" ||
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "az"
      ? a.title.localeCompare(b.title)
      : sort === "rich"
        ? b.points.length - a.points.length
        : 0,
  );
  const live = db.services.filter((s) => s.visible).length;
  const catCount = (c: ServiceCategory): number => db.services.filter((s) => s.category === c).length;
  const totalTags = db.services.reduce((n, s) => n + s.tags.length, 0);
  const groups = (Object.keys(CAT_STYLE) as ServiceCategory[]).map((c) => {
    const items = db.services.filter((s) => s.category === c);
    return {
      id: c,
      label: CAT_LABEL[c],
      color: CAT_STYLE[c].bg,
      total: items.length,
      live: items.filter((s) => s.visible).length,
      extra: `${items.reduce((n, s) => n + s.points.length, 0)} deliverables`,
    };
  });
  const addInCategory = (c: ServiceCategory): void => {
    const d = CATEGORY_DEFAULTS[c];
    onEdit({
      id: uid("srv"),
      title: "",
      titleFr: "",
      desc: "",
      descFr: "",
      tags: [],
      points: [],
      pointsFr: [],
      category: c,
      icon: "",
      iconImage: "",
      bestForEn: d.bestForEn,
      bestForFr: d.bestForFr,
      timelineEn: d.timelineEn,
      timelineFr: d.timelineFr,
      visible: true,
    });
  };
  return (
    <ListShell
      title="Services"
      sub={`${db.services.length} services · what the client buys, how it ships`}
      live={live}
      hidden={db.services.length - live}
      accent="#38bdf8"
      icon={Briefcase}
      stat={`${totalTags} stack tags in play`}
      previewHref="/#services"
      onPreview={onPreview}
      onHardPreview={onHardPreview}
      refreshing={refreshing}
      onAdd={() => onEdit(null)}
      addLabel="New service"
      toolbar={
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField value={query} onChange={setQuery} placeholder="Search services, tags, deliverables…" />
            <SortSelect
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { id: "curated", label: "Curated" },
                { id: "az", label: "Title A–Z" },
                { id: "rich", label: "Most deliverables" },
              ]}
            />
          </div>
          <ChipRow<ServiceCategory | "all">
            value={cat}
            onPick={setCat}
            options={[
              { id: "all", label: "All", count: db.services.length },
              { id: "development", label: "Development", count: catCount("development"), color: "#ff3d00" },
              { id: "design", label: "Design", count: catCount("design"), color: "#38bdf8" },
              { id: "backend", label: "Backend", count: catCount("backend"), color: "#a78bfa" },
              { id: "growth", label: "Growth", count: catCount("growth"), color: "#fbbf24" },
            ]}
          />
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">No services match — try another search.</p>
          )}
        </>
      }
      inventory={
        <InventoryGrid
          title="Categories"
          groups={groups}
          active={cat}
          onFilter={setCat}
          onAddIn={addInCategory}
          onBulk={(id, action) =>
            onBulk((x) => (x as unknown as AdminService).category === id, action)
          }
        />
      }
    >
      {sorted.map((s) => {
        const cat = CAT_STYLE[s.category] ?? CAT_STYLE.development;
        const CatIcon = cat.icon;
        return (
          <div
            key={s.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-28px_rgba(0,0,0,0.9)]",
              s.visible ? "border-white/10 hover:border-white/25" : "border-dashed border-white/15 opacity-60",
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: cat.wash }}
            />
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
              style={{ background: cat.bg, boxShadow: `0 0 16px ${cat.bg}` }}
            />
            {!s.visible && (
              <p className="relative mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                Hidden from the site — press the eye to publish (syncs to cloud).
              </p>
            )}
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              <span
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                style={{ backgroundColor: cat.bg, color: cat.fg, boxShadow: `0 0 28px ${cat.bg}66` }}
              >
                {s.iconImage ? (
                  <span className="relative block h-full w-full p-2">
                    <SmartImage src={s.iconImage} alt="" fill fit="contain" sizes="64px" />
                  </span>
                ) : (
                  (() => {
                    const Picked = libIcon(s.icon);
                    const Show = Picked ?? CatIcon;
                    return <Show className="h-7 w-7" aria-hidden="true" />;
                  })()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-3 py-1 font-mono text-[10px] font-black tracking-[0.16em] uppercase"
                    style={{ borderColor: `${cat.bg}80`, backgroundColor: `${cat.bg}1a`, color: cat.bg }}
                  >
                    {CAT_LABEL[s.category]}
                  </span>
                  <LiveBadge visible={s.visible} />
                  <span className="font-mono text-[10px] text-white/40 tabular-nums">
                    {s.points.length} deliverables · {s.tags.length} tags
                  </span>
                </p>
                <p className="font-display mt-2 text-xl leading-tight font-black tracking-tight sm:text-2xl">{s.title}</p>
                {s.titleFr && <p className="mt-0.5 truncate text-sm text-white/40">{s.titleFr}</p>}
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/65 sm:text-[15px]">{s.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.tags.slice(0, 8).map((t) => {
                    const logo = techLogo(t);
                    return (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold text-white/65 uppercase"
                      >
                        {logo && <Image src={logo} alt="" width={14} height={14} className="block h-3.5 w-3.5" />}
                        {t}
                      </span>
                    );
                  })}
                  {s.tags.length > 8 && (
                    <span className="font-mono text-[10px] text-white/35">+{s.tags.length - 8}</span>
                  )}
                </div>
                {(s.tags.length === 0 || s.points.length === 0) && (
                  <p className="mt-2.5 rounded-lg border border-dashed border-white/15 px-3 py-2 font-mono text-[10px] tracking-[0.06em] text-white/35 uppercase">
                    ⚠ {s.tags.length === 0 ? "No stack tags" : ""}
                    {s.tags.length === 0 && s.points.length === 0 ? " · " : ""}
                    {s.points.length === 0 ? "No deliverables" : ""} — thin card on the site
                  </p>
                )}
                <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-xs text-white/60">
                    <Users className="h-3.5 w-3.5 shrink-0" style={{ color: cat.bg }} />
                    <span className="truncate">{s.bestForEn}</span>
                  </p>
                  <p className="flex items-center gap-2 text-xs text-white/60">
                    <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: cat.bg }} />
                    <span className="truncate">{s.timelineEn}</span>
                  </p>
                </div>
                {s.points.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {s.points.slice(0, 3).map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs leading-relaxed text-white/55">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: cat.bg }} />
                        <span className="line-clamp-1">{pt}</span>
                      </li>
                    ))}
                    {s.points.length > 3 && (
                      <li className="font-mono text-[10px] text-white/30">+{s.points.length - 3} more deliverables</li>
                    )}
                  </ul>
                )}
              </div>
              <RowActions
                visible={s.visible}
                onToggle={() => onToggle(s.id)}
                onEdit={() => onEdit(s)}
                onDelete={() => remove(s.id)}
                onDuplicate={() => onDuplicate(s.id)}
              />
            </div>
          </div>
        );
      })}
    </ListShell>
  );
}

/* --------------------------------- skills -------------------------------- */

const SKILL_CAT_META: Record<AdminSkill["cat"], { label: string; color: string }> = {
  frontend: { label: "Frontend", color: "#d7fd44" },
  backend: { label: "Backend", color: "#38bdf8" },
  tools: { label: "Tools & Design", color: "#a78bfa" },
};

const PROOF_ICON: Record<AdminSkill["proof"], typeof Flame> = {
  daily: Flame,
  portfolio: LayoutGrid,
  client: Briefcase,
  learning: Sprout,
};

function SkillsTab({
  db,
  remove,
  onEdit,
  onToggle,
  onDuplicate,
  onBulk,
  onPreview,
  onHardPreview,
  refreshing,
}: {
  db: AdminDB;
  remove: (id: string) => void;
  onEdit: (item: AdminSkill | null) => void;
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulk: (match: (item: never) => boolean, action: "delete" | "show" | "hide") => void;
  onPreview: (href: string) => void;
  onHardPreview: (href: string) => void;
  refreshing: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<AdminSkill["cat"] | "all">("all");
  const [sort, setSort] = useState<"curated" | "level" | "az">("curated");
  const q = query.trim().toLowerCase();
  const filtered = db.skills.filter(
    (s) =>
      (cat === "all" || s.cat === cat) &&
      (q === "" || s.name.toLowerCase().includes(q) || s.detailEn.toLowerCase().includes(q)),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "level" ? b.level - a.level : sort === "az" ? a.name.localeCompare(b.name) : 0,
  );
  const live = db.skills.filter((s) => s.visible).length;
  const catCount = (c: AdminSkill["cat"]): number => db.skills.filter((s) => s.cat === c).length;
  const avgLevel =
    db.skills.length === 0
      ? 0
      : Math.round(db.skills.reduce((n, s) => n + s.level, 0) / db.skills.length);
  const groups = (Object.keys(SKILL_CAT_META) as AdminSkill["cat"][]).map((c) => {
    const items = db.skills.filter((s) => s.cat === c);
    const avg =
      items.length === 0 ? 0 : Math.round(items.reduce((n, s) => n + s.level, 0) / items.length);
    return {
      id: c,
      label: SKILL_CAT_META[c].label,
      color: SKILL_CAT_META[c].color,
      total: items.length,
      live: items.filter((s) => s.visible).length,
      extra: `avg ${avg}`,
    };
  });
  const projectRefs = useMemo(
    () => db.projects.map((p) => ({ title: p.title, tech: p.tech, visible: p.visible })),
    [db.projects],
  );
  return (
    <ListShell
      title="Skills"
      sub={`${db.skills.length} skills · mastery + proof + projects × score`}
      live={live}
      hidden={db.skills.length - live}
      accent="#d7fd44"
      icon={Cpu}
      stat={`avg mastery ${avgLevel}`}
      previewHref="/#skills"
      onPreview={onPreview}
      onHardPreview={onHardPreview}
      refreshing={refreshing}
      onAdd={() => onEdit(null)}
      addLabel="New skill"
      toolbar={
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField value={query} onChange={setQuery} placeholder="Search skills…" />
            <SortSelect
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { id: "curated", label: "Curated" },
                { id: "level", label: "Level ↓" },
                { id: "az", label: "Name A–Z" },
              ]}
            />
          </div>
          <ChipRow<AdminSkill["cat"] | "all">
            value={cat}
            onPick={setCat}
            options={[
              { id: "all", label: "All", count: db.skills.length },
              { id: "frontend", label: "Frontend", count: catCount("frontend"), color: "#d7fd44" },
              { id: "backend", label: "Backend", count: catCount("backend"), color: "#38bdf8" },
              { id: "tools", label: "Tools", count: catCount("tools"), color: "#a78bfa" },
            ]}
          />
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">No skills match — try another search.</p>
          )}
        </>
      }
      inventory={
        <InventoryGrid
          title="Categories"
          groups={groups}
          active={cat}
          onFilter={setCat}
          onAddIn={(c) =>
            onEdit({
              id: uid("skill"),
              name: "",
              cat: c,
              level: 70,
              proof: "learning",
              logo: "",
              icon: "",
              detailEn: "",
              detailFr: "",
              visible: true,
            })
          }
          onBulk={(id, action) =>
            onBulk((x) => (x as unknown as AdminSkill).cat === id, action)
          }
        />
      }
    >
      {sorted.map((s) => {
        const color = LEVEL_COLOR[levelKeyOf(s.level)] ?? "#d7fd44";
        const segs = Array.from({ length: 5 }, (_, i) => i < Math.round(s.level / 20));
        const catMeta = SKILL_CAT_META[s.cat];
        const ProofIcon = PROOF_ICON[s.proof];
        const usage = skillProjectUsage(s.name, s.level, projectRefs);
        return (
          <div
            key={s.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-28px_rgba(0,0,0,0.9)]",
              s.visible ? "border-white/10 hover:border-white/25" : "border-dashed border-white/15 opacity-60",
            )}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}14 0%, transparent 55%)` }} />
            <span aria-hidden="true" className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full" style={{ background: color, boxShadow: `0 0 16px ${color}` }} />
            {!s.visible && (
              <p className="relative mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                Hidden from the site — press the eye to publish (syncs to cloud).
              </p>
            )}
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              {(() => {
                const Picked = libIcon(s.icon);
                if (Picked) {
                  return (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10" style={{ backgroundColor: `${color}14`, color }}>
                      <Picked className="h-8 w-8" aria-hidden="true" />
                    </span>
                  );
                }
                if (s.logo) {
                  return (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-2">
                      <span className="relative block h-full w-full">
                        <SmartImage src={s.logo} alt="" fill fit="contain" sizes="64px" />
                      </span>
                    </span>
                  );
                }
                return (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-display text-xl font-black">
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                );
              })()}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl font-black tracking-tight">{s.name}</span>
                  <LiveBadge visible={s.visible} />
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black tracking-[0.12em] uppercase" style={{ borderColor: `${color}70`, backgroundColor: `${color}1a`, color }}>
                    {levelTag(s.level)} · {s.level}
                  </span>
                  <span className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase" style={{ borderColor: `${catMeta.color}55`, color: catMeta.color }}>
                    {catMeta.label}
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-white/60 uppercase">
                    <ProofIcon className="h-3 w-3 text-[#ff3d00]" aria-hidden="true" />
                    {PROOF_LABEL[s.proof]}
                  </span>
                </p>
                <div className="mt-2.5 flex gap-1" aria-hidden="true">
                  {segs.map((on, i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full" style={on ? { backgroundColor: color, boxShadow: `0 0 10px ${color}66` } : { backgroundColor: "rgba(255,255,255,0.12)" }} />
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <span className="flex items-center gap-1.5 rounded-xl border border-[#ff3d00]/30 bg-[#ff3d00]/[0.07] px-3 py-2 font-mono text-[11px] font-black text-[#ff8a5c] uppercase" title={usage.projects.join(" · ") || "No project uses this skill yet"}>
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                    × {usage.count} {usage.count === 1 ? "project" : "projects"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl border border-[#d7fd44]/30 bg-[#d7fd44]/[0.07] px-3 py-2 font-mono text-[11px] font-black text-[#d7fd44] uppercase tabular-nums" title="Showcase score = mastery + project proof">
                    <Star className="h-3.5 w-3.5 shrink-0" />
                    Score {usage.score}
                  </span>
                </div>
                {usage.projects.length > 0 ? (
                  <p className="mt-2 truncate text-xs text-white/45" title={usage.projects.join(" · ")}>▸ {usage.projects.slice(0, 3).join(" · ")}{usage.projects.length > 3 ? ` +${usage.projects.length - 3}` : ""}</p>
                ) : (
                  <p className="mt-2 text-xs text-amber-300/80">⚠ Not used in any project yet — add it to a project stack so the site card looks complete.</p>
                )}
                {(s.detailEn || s.detailFr) && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/55">
                    {s.detailEn}
                    {s.detailFr ? ` · ${s.detailFr}` : ""}
                  </p>
                )}
              </div>
              <RowActions
                visible={s.visible}
                onToggle={() => onToggle(s.id)}
                onEdit={() => onEdit(s)}
                onDelete={() => remove(s.id)}
                onDuplicate={() => onDuplicate(s.id)}
              />
            </div>
          </div>
        );
      })}
    </ListShell>
  );
}

/* -------------------------------- projects ------------------------------- */

function ProjectsTab({
  db,
  remove,
  onEdit,
  onToggle,
  onDuplicate,
  onBulk,
  onPreview,
  onHardPreview,
  refreshing,
  likes,
}: {
  db: AdminDB;
  remove: (id: string) => void;
  onEdit: (item: AdminProject | null) => void;
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulk: (match: (item: never) => boolean, action: "delete" | "show" | "hide") => void;
  onPreview: (href: string) => void;
  onHardPreview: (href: string) => void;
  refreshing: boolean;
  likes: Record<string, number>;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "in-progress">("all");
  const [pcat, setPcat] = useState<string>("all");
  const [sort, setSort] = useState<"curated" | "newest" | "az">("curated");
  const q = query.trim().toLowerCase();
  const cats = useMemo(() => {
    const seen: string[] = [];
    for (const p of db.projects) {
      const c = p.category.trim();
      if (c !== "" && !seen.includes(c)) seen.push(c);
    }
    return seen.sort((a, b) => a.localeCompare(b));
  }, [db.projects]);
  const hasUncat = db.projects.some((p) => p.category.trim() === "");
  const inGroup = (p: AdminProject, id: string): boolean =>
    id === "__none__" ? p.category.trim() === "" : p.category === id;
  const filtered = db.projects.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (pcat === "all" || inGroup(p, pcat)) &&
      (q === "" ||
        p.title.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tech.some((t) => t.toLowerCase().includes(q))),
  );
  const yearNum = (y: string): number => Number.parseInt(y, 10) || 0;
  const sorted = [...filtered].sort((a, b) =>
    sort === "newest"
      ? yearNum(b.year) - yearNum(a.year)
      : sort === "az"
        ? a.title.localeCompare(b.title)
        : 0,
  );
  const live = db.projects.filter((p) => p.visible).length;
  const oss = db.projects.filter((p) => p.opensource).length;
  const PALETTE = ["#ff3d00", "#38bdf8", "#a78bfa", "#fbbf24", "#34d399", "#fb7185"];
  const groups = [
    ...cats.map((c, i) => {
      const items = db.projects.filter((p) => p.category === c);
      return {
        id: c,
        label: c,
        color: PALETTE[i % PALETTE.length]!,
        total: items.length,
        live: items.filter((p) => p.visible).length,
      };
    }),
    ...(hasUncat
      ? [
          {
            id: "__none__",
            label: "Uncategorized",
            color: "#8a8a82",
            total: db.projects.filter((p) => p.category.trim() === "").length,
            live: db.projects.filter((p) => p.category.trim() === "" && p.visible).length,
          },
        ]
      : []),
  ];
  return (
    <ListShell
      title="Projects"
      sub={`${db.projects.length} projects · stack powers skill scores`}
      live={live}
      hidden={db.projects.length - live}
      accent="#ff3d00"
      icon={FolderGit}
      stat={`${oss} open source`}
      previewHref="/#projects"
      onPreview={onPreview}
      onHardPreview={onHardPreview}
      refreshing={refreshing}
      onAdd={() => onEdit(null)}
      addLabel="New project"
      toolbar={
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField value={query} onChange={setQuery} placeholder="Search projects, stack…" />
            <SortSelect
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { id: "curated", label: "Curated" },
                { id: "newest", label: "Newest" },
                { id: "az", label: "Title A–Z" },
              ]}
            />
          </div>
          <ChipRow<"all" | "completed" | "in-progress">
            value={status}
            onPick={setStatus}
            options={[
              { id: "all", label: "All", count: db.projects.length },
              { id: "completed", label: "Completed", count: db.projects.filter((p) => p.status === "completed").length, color: "#34d399" },
              { id: "in-progress", label: "In progress", count: db.projects.filter((p) => p.status === "in-progress").length, color: "#fbbf24" },
            ]}
          />
          {status !== "all" && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <span className="w-full font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Bulk — {status}</span>
              <button type="button" onClick={() => onBulk((x) => (x as unknown as AdminProject).status === status, "show")} className="cursor-pointer rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20">Publish all</button>
              <button type="button" onClick={() => onBulk((x) => (x as unknown as AdminProject).status === status, "hide")} className="cursor-pointer rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20">Hide all</button>
              <button type="button" onClick={() => onBulk((x) => (x as unknown as AdminProject).status === status, "delete")} className="cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">Delete all</button>
            </div>
          )}
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">No projects match.</p>
          )}
        </>
      }
      inventory={
        <InventoryGrid
          title="Categories"
          groups={groups}
          active={pcat}
          onFilter={setPcat}
          onAddIn={(id) =>
            onEdit({
              id: uid("proj"),
              title: "",
              titleFr: "",
              desc: "",
              descFr: "",
              tech: [],
              status: "in-progress",
              opensource: false,
              category: id === "__none__" ? "" : id,
              github: "",
              period: "",
              year: String(new Date().getFullYear()),
              demo: "",
              image: "",
              roleEn: "",
              roleFr: "",
              timelineEn: "",
              timelineFr: "",
              briefEn: [],
              briefFr: [],
              sponsored: false,
              visible: true,
            })
          }
          onBulk={(id, action) =>
            onBulk((x) => inGroup(x as unknown as AdminProject, id), action)
          }
        />
      }
    >
      {sorted.map((p) => (
        <div
          key={p.id}
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-28px_rgba(0,0,0,0.9)]",
            p.visible ? "border-white/10 hover:border-white/25" : "border-dashed border-white/15 opacity-60",
          )}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: p.status === "completed" ? "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, transparent 55%)" : "linear-gradient(135deg, rgba(251,191,36,0.10) 0%, transparent 55%)" }} />
          {!p.visible && (
            <p className="relative mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              Hidden from the site — press the eye to publish (syncs to cloud).
            </p>
          )}
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            {p.image ? (
              <span className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                <SmartImage src={p.image} alt="" fill fit="cover" sizes="96px" />
              </span>
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ff3d00]/15 font-display text-2xl font-black text-[#ff3d00] shadow-[0_0_24px_rgba(255,61,0,0.25)]">
                {p.title.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-black tracking-tight">{p.title}</span>
                <LiveBadge visible={p.visible} />
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={cn("rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black tracking-[0.12em] uppercase", p.status === "completed" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-amber-400/40 bg-amber-400/10 text-amber-300")}>
                  {p.status}
                </span>
                {p.sponsored && (
                  <span className="rounded-full border border-[#ff3d00]/50 bg-[#ff3d00]/10 px-2.5 py-0.5 font-mono text-[10px] font-black tracking-[0.12em] text-[#ff3d00] uppercase">★ Sponsored</span>
                )}
                {p.opensource && (
                  <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] text-white/50 uppercase">Open source</span>
                )}
                {(likes[p.github || p.title] ?? 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 tabular-nums">
                    <Heart className="h-3 w-3 fill-rose-400 text-rose-400" aria-hidden="true" />
                    {likes[p.github || p.title]}
                  </span>
                )}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65 sm:text-[15px]">{p.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tech.slice(0, 10).map((t) => {
                  const logo = techLogo(t);
                  return (
                    <span key={t} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold text-white/65 uppercase">
                      {logo && <Image src={logo} alt="" width={14} height={14} className="block h-3.5 w-3.5" />}
                      {t}
                    </span>
                  );
                })}
                {p.tech.length > 10 && (
                  <span className="font-mono text-[10px] text-white/35">+{p.tech.length - 10}</span>
                )}
              </div>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
                <span>{p.category || "—"} · {p.year || "—"}</span>
                {(p.roleEn || p.timelineEn) && (
                  <span className="truncate">{[p.roleEn, p.timelineEn].filter(Boolean).join(" · ")}</span>
                )}
                {(p.briefEn.length > 0 || p.briefFr.length > 0) && (
                  <span className="flex items-center gap-1 text-white/50">
                    <BookOpen className="h-3 w-3" />
                    {Math.max(p.briefEn.length, p.briefFr.length)} brief
                  </span>
                )}
              </p>
              {!p.github && !p.demo && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 font-mono text-[10px] text-white/35 uppercase">⚠ No code or demo link — card converts less</p>
              )}
              {(p.github || p.demo) && (
                <p className="mt-2 flex flex-wrap gap-2">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white/55 transition-colors hover:border-[#ff3d00] hover:text-[#ff3d00]">
                      <ExternalLink className="h-3 w-3" />
                      Code
                    </a>
                  )}
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white/55 transition-colors hover:border-emerald-400 hover:text-emerald-300">
                      <Globe className="h-3 w-3" />
                      Demo
                    </a>
                  )}
                </p>
              )}
            </div>
            <RowActions
              visible={p.visible}
              onToggle={() => onToggle(p.id)}
              onEdit={() => onEdit(p)}
              onDelete={() => remove(p.id)}
              onDuplicate={() => onDuplicate(p.id)}
            />
          </div>
        </div>
      ))}
    </ListShell>
  );
}

/* ---------------------------------- certs --------------------------------- */

function CertsTab({
  db,
  remove,
  onEdit,
  onToggle,
  onDuplicate,
  onBulk,
  onPreview,
  onHardPreview,
  refreshing,
}: {
  db: AdminDB;
  remove: (id: string) => void;
  onEdit: (item: AdminCert | null) => void;
  onToggle: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulk: (match: (item: never) => boolean, action: "delete" | "show" | "hide") => void;
  onPreview: (href: string) => void;
  onHardPreview: (href: string) => void;
  refreshing: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [issuer, setIssuer] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "issuer">("newest");
  const q = query.trim().toLowerCase();
  const issuers = useMemo(() => {
    const seen: string[] = [];
    for (const c of db.certs) {
      const v = c.issuerEn.trim();
      if (v !== "" && !seen.includes(v)) seen.push(v);
    }
    return seen.sort((a, b) => a.localeCompare(b));
  }, [db.certs]);
  const inGroup = (c: AdminCert, id: string): boolean =>
    id === "__none__" ? c.issuerEn.trim() === "" : c.issuerEn === id;
  const hasUnknown = db.certs.some((c) => c.issuerEn.trim() === "");
  const filtered = db.certs.filter(
    (c) =>
      (issuer === "all" || inGroup(c, issuer)) &&
      (q === "" ||
        c.titleEn.toLowerCase().includes(q) ||
        c.issuerEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))),
  );
  const yearNum = (y: string): number => Number.parseInt(y, 10) || 0;
  const sorted = [...filtered].sort((a, b) =>
    sort === "newest"
      ? yearNum(b.year) - yearNum(a.year)
      : a.issuerEn.localeCompare(b.issuerEn),
  );
  const live = db.certs.filter((c) => c.visible).length;
  const unverified = db.certs.filter((c) => !c.verify).length;
  const verifiedPct =
    db.certs.length === 0
      ? 0
      : Math.round(((db.certs.length - unverified) / db.certs.length) * 100);
  const PALETTE = ["#a78bfa", "#38bdf8", "#fbbf24", "#34d399", "#fb7185", "#ff3d00"];
  const groups = [
    ...issuers.map((name, i) => {
      const items = db.certs.filter((c) => c.issuerEn === name);
      return {
        id: name,
        label: name,
        color: PALETTE[i % PALETTE.length]!,
        total: items.length,
        live: items.filter((c) => c.visible).length,
        extra: items[0] ? `${items[0].year}` : "",
      };
    }),
    ...(hasUnknown
      ? [
          {
            id: "__none__",
            label: "Unknown issuer",
            color: "#8a8a82",
            total: db.certs.filter((c) => c.issuerEn.trim() === "").length,
            live: db.certs.filter((c) => c.issuerEn.trim() === "" && c.visible).length,
            extra: "",
          },
        ]
      : []),
  ];
  return (
    <ListShell
      title="Certificates"
      sub={`${db.certs.length} credentials · proof that closes deals`}
      live={live}
      hidden={db.certs.length - live}
      accent="#a78bfa"
      icon={Award}
      stat={`${verifiedPct}% verified`}
      previewHref="/#certificates"
      onPreview={onPreview}
      onHardPreview={onHardPreview}
      refreshing={refreshing}
      onAdd={() => onEdit(null)}
      addLabel="New certificate"
      toolbar={
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField value={query} onChange={setQuery} placeholder="Search certificates, issuers, skills…" />
            <SortSelect
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { id: "newest", label: "Newest" },
                { id: "issuer", label: "Issuer A–Z" },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {unverified > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 font-mono text-[10px] font-bold text-amber-300 uppercase">
                {unverified} without verify link
              </span>
            )}
          </div>
          {issuers.length > 0 && (
            <ChipRow<string>
              value={issuer}
              onPick={setIssuer}
              options={[
                { id: "all", label: "All", count: db.certs.length },
                ...issuers.map((name, i) => ({
                  id: name,
                  label: name,
                  count: db.certs.filter((c) => c.issuerEn === name).length,
                  color: PALETTE[i % PALETTE.length]!,
                })),
              ]}
            />
          )}
          {sorted.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">No certificates match.</p>
          )}
        </>
      }
      inventory={
        <InventoryGrid
          title="Issuers"
          groups={groups}
          active={issuer}
          onFilter={setIssuer}
          onAddIn={(id) =>
            onEdit({
              id: uid("cert"),
              titleEn: "",
              titleFr: "",
              issuerEn: id === "__none__" ? "" : id,
              issuerFr: "",
              year: String(new Date().getFullYear()),
              months: 6,
              code: "",
              skills: [],
              image: "",
              verify: "",
              visible: true,
            })
          }
          onBulk={(id, action) =>
            onBulk((x) => inGroup(x as unknown as AdminCert, id), action)
          }
        />
      }
    >
      {sorted.map((c) => (
        <div
          key={c.id}
          className={cn(
            "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-28px_rgba(0,0,0,0.9)]",
            c.visible ? "border-white/10 hover:border-white/25" : "border-dashed border-white/15 opacity-60",
          )}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, transparent 55%)" }} />
          {!c.visible && (
            <p className="relative mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              Hidden from the site — press the eye to publish (syncs to cloud).
            </p>
          )}
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            {c.image ? (
              <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-1.5 shadow-lg">
                <span className="relative block h-full w-full">
                  <SmartImage src={c.image} alt="" fill fit="contain" sizes="64px" />
                </span>
              </span>
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]">
                <GraduationCap className="h-7 w-7" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-black tracking-tight">{c.titleEn}</span>
                <LiveBadge visible={c.visible} />
              </p>
              <p className="mt-0.5 truncate text-sm text-white/45">{c.titleFr}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-white/45 uppercase">
                <span className="rounded-lg bg-white/[0.05] px-2 py-1">{c.issuerEn} · {c.year}</span>
                <span className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1">
                  <Calendar className="h-3 w-3" />
                  {c.months} mo
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1">
                  <Hash className="h-3 w-3" />
                  {c.code || "—"}
                </span>
              </p>
              {c.skills.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {c.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold text-white/65 uppercase"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {c.verify ? (
                <a
                  href={c.verify}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] font-bold text-emerald-300 uppercase transition-colors hover:bg-emerald-400/20"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verify credential
                </a>
              ) : (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-1.5 font-mono text-[10px] text-white/35 uppercase">⚠ No verify link — add one to close deals</p>
              )}
            </div>
            <RowActions
              visible={c.visible}
              onToggle={() => onToggle(c.id)}
              onEdit={() => onEdit(c)}
              onDelete={() => remove(c.id)}
              onDuplicate={() => onDuplicate(c.id)}
            />
          </div>
        </div>
      ))}
    </ListShell>
  );
}

/** One-tap busy reasons — each sets the EN + FR badge notes together. */
const NOTE_PRESETS = [
  { id: "sleeping", label: "Sleeping", en: "Sleeping — back soon", fr: "Je dors — de retour bientôt" },
  { id: "gym", label: "Gym", en: "At the gym", fr: "À la salle de sport" },
  { id: "out", label: "Out", en: "Out right now", fr: "Dehors pour le moment" },
  { id: "football", label: "Football", en: "Playing football", fr: "Je joue au foot" },
  { id: "busy", label: "Busy", en: "Busy — replies later", fr: "Occupé — réponse plus tard" },
] as const;

/* -------------------------------- settings -------------------------------- */

function SettingsTab({
  db,
  patch,
  onReset,
  onImport,
  onSettingsSync,
  cloudOk,
  lastRefresh,
  onPushAll,
  onPullAll,
  onLogoutTab,
  onPreviewSite,
}: {
  db: AdminDB;
  patch: (fn: (d: AdminDB) => void) => void;
  onReset: () => void;
  onImport: (db: AdminDB) => void;
  onSettingsSync: (next: AdminDB["settings"]) => void;
  cloudOk: boolean;
  lastRefresh: number | null;
  onPushAll: () => Promise<void>;
  onPullAll: () => Promise<void>;
  onLogoutTab: () => void;
  onPreviewSite: () => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const runPush = (): void => {
    if (pushing || pulling) return;
    setPushing(true);
    void onPushAll().finally(() => setPushing(false));
  };
  const runPull = (): void => {
    if (pushing || pulling) return;
    setPulling(true);
    void onPullAll().finally(() => setPulling(false));
  };
  /** Patch locally instantly AND mirror to the cloud (debounced) — settings
   *  now reach the live site for real, not just this browser. */
  const set = <K extends keyof AdminDB["settings"]>(key: K, value: AdminDB["settings"][K]): void => {
    const next = { ...db.settings, [key]: value };
    patch((d) => {
      d.settings[key] = value;
    });
    onSettingsSync(next);
  };

  /** One tap sets EN + FR notes together, then syncs once (debounced). */
  const applyPreset = (p: { en: string; fr: string }): void => {
    const next = { ...db.settings, workNote: p.en, workNoteFr: p.fr };
    patch((d) => {
      d.settings.workNote = p.en;
      d.settings.workNoteFr = p.fr;
    });
    onSettingsSync(next);
  };

  /** Live mirror — exactly what the site badges will show. */
  const mirrorLabel =
    workLabel(availabilityFromSettings(db.settings), "en", {
      available: "Available for work",
      unavailable: "Unavailable",
    }) + workDeadlineSuffix(availabilityFromSettings(db.settings), "en");

  const doExport = (): void => {
    try {
      const blob = new Blob([exportJSON(db)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budi-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert("Export failed in this browser.");
    }
  };

  const doImport = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (): void => {
      const next = importJSON(String(reader.result ?? ""));
      if (!next) {
        window.alert("Invalid backup file — import aborted, nothing changed.");
        return;
      }
      if (!window.confirm(`Restore backup? ${next.skills.length} skills · ${next.services.length} services · ${next.projects.length} projects · ${next.certs.length} certs.`)) return;
      saveDB(next);
      onImport(next);
    };
    reader.onerror = (): void => {
      window.alert("Could not read that file.");
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Settings</h2>
          <p className="mt-1 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase">
            Every change pushes to Supabase + rebuilds the site
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.18em] uppercase",
            cloudOk
              ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.25)]"
              : "border-amber-400/40 bg-amber-400/10 text-amber-300",
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {cloudOk && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            )}
            <span
              className={cn(
                "relative inline-flex h-1.5 w-1.5 rounded-full",
                cloudOk ? "bg-emerald-400" : "bg-amber-300",
              )}
            />
          </span>
          {cloudOk ? "Cloud sync on" : "Local only"}
        </span>
      </div>

      {/* Availability command — THE one switch for every badge on the site */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.06] via-transparent to-[#ff3d00]/[0.06] p-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#d7fd44] to-transparent"
        />
        <p className="relative flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-[#d7fd44]/80 uppercase">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          Availability command · one switch, every badge
        </p>
        <div className="relative mt-3">
          <Toggle
            checked={db.settings.workStatus === "available"}
            onChange={(v) => set("workStatus", v ? "available" : "unavailable")}
            label={
              db.settings.workStatus === "available"
                ? "Available for work — every badge green"
                : "Not available — every badge shows your note"
            }
            desc="Navbar · utility bar · footer · about orbit · contact · this console — all flip together, site rebuilds instantly."
          />
        </div>
        {db.settings.workStatus === "unavailable" && (
          <div className="relative mt-4 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
              Why — one tap sets EN + FR together
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {NOTE_PRESETS.map((p) => {
                const presetActive = db.settings.workNote === p.en;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    aria-pressed={presetActive}
                    className={cn(
                      "cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase transition-all",
                      presetActive
                        ? "border-[#ff3d00] bg-[#ff3d00] text-[#1a0e05] shadow-[0_0_20px_rgba(255,61,0,0.4)]"
                        : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/30 hover:text-white",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Note (EN)" hint="site badge text">
                <input
                  value={db.settings.workNote}
                  onChange={(e) => set("workNote", e.target.value)}
                  placeholder="Sleeping — back soon"
                  className={inputCls}
                  maxLength={60}
                />
              </Field>
              <Field label="Note (FR)" hint="texte du badge">
                <input
                  value={db.settings.workNoteFr}
                  onChange={(e) => set("workNoteFr", e.target.value)}
                  placeholder="Je dors — de retour bientôt"
                  className={inputCls}
                  maxLength={60}
                />
              </Field>
            </div>
            <div className="mt-3">
              <DeadlineInput
                label="Back on (deadline)"
                value={db.settings.workUntil}
                onChange={(v) => set("workUntil", v)}
              />
            </div>
          </div>
        )}
        <div className="relative mt-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
          <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">
            Site shows
          </span>
          <span
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] uppercase",
              db.settings.workStatus === "available"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                db.settings.workStatus === "available" ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
            <span className="truncate">{mirrorLabel}</span>
          </span>
        </div>
      </div>

      {/* Sync center — push everything up, pull the cloud down, preview out */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#bef264]/25 bg-gradient-to-br from-[#bef264]/[0.06] via-transparent to-[#ff3d00]/[0.06] p-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#bef264] to-transparent"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_28px_rgba(52,211,153,0.3)]">
            <Database className="h-7 w-7 text-emerald-300" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-300/80 uppercase">
              Sync center · cloud ⇄ browser
            </p>
            <p className="font-display mt-1 text-xl font-bold text-white" aria-live="polite">
              {pushing
                ? "Pushing everything…"
                : pulling
                  ? "Pulling cloud snapshot…"
                  : cloudOk
                    ? "Cloud mirrors this screen"
                    : "Working local-only"}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase tabular-nums">
              {lastRefresh
                ? `Site rebuilt · ${new Date(lastRefresh).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "No rebuild yet this session"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={runPush}
              disabled={pushing || pulling}
              title="Push every local row to the cloud (same-id rows get overwritten)"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#bef264] px-5 py-3 text-sm font-black text-[#101200] shadow-[0_12px_32px_-12px_rgba(190,242,100,0.7)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              <Upload
                className={cn("h-4 w-4", pushing && "animate-bounce")}
                aria-hidden="true"
              />
              {pushing ? "Pushing…" : "Push everything"}
            </button>
            <button
              type="button"
              onClick={runPull}
              disabled={pushing || pulling}
              title="Replace local edits with the cloud snapshot"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:text-white disabled:cursor-wait disabled:opacity-60"
            >
              <Download
                className={cn("h-4 w-4", pulling && "animate-bounce")}
                aria-hidden="true"
              />
              {pulling ? "Pulling…" : "Pull cloud"}
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onPreviewSite}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#ff3d00]/50 bg-[#ff3d00]/10 px-4 py-2.5 text-sm font-bold text-[#ff8a5c] transition-all hover:-translate-y-0.5 hover:bg-[#ff3d00]/20"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Preview full site
          </button>
          <p className="ml-auto font-mono text-[9px] tracking-[0.14em] text-white/30 uppercase">
            Push overwrites same-id cloud rows · Pull discards local edits
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
            <Globe className="h-3.5 w-3.5 text-[#38bdf8]" aria-hidden="true" />
            Site identity
          </p>
          <Field label="Site name">
            <input value={db.settings.siteName} onChange={(e) => set("siteName", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tagline">
            <input value={db.settings.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Contact email">
            <input value={db.settings.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} dir="ltr" />
          </Field>
          <ImageUploadField
            label="Hero photo"
            hint="portrait on the site"
            value={db.settings.heroImage ?? ""}
            onChange={(v) => set("heroImage", v)}
            pastePlaceholder="/images/general/hero.jpg or https://…"
          />
          <ImageUploadField
            label="About photo"
            hint="story portrait"
            value={db.settings.aboutImage ?? ""}
            onChange={(v) => set("aboutImage", v)}
            pastePlaceholder="/images/general/about2.jpg or https://…"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
            <SettingsIcon className="h-3.5 w-3.5 text-[#d7fd44]" aria-hidden="true" />
            Behavior
          </p>
          <Toggle checked={db.settings.showLoader} onChange={(v) => set("showLoader", v)} label="Intro loader on site" desc="Cinematic brand intro on first visit" />
          <Toggle checked={db.settings.likesEnabled} onChange={(v) => set("likesEnabled", v)} label="Project likes enabled" desc="Hearts on project cards + live counts" />
          <Toggle checked={db.settings.maintenance} onChange={(v) => set("maintenance", v)} label="Maintenance mode" desc="Banner on the live site while you ship" />
          <p className="rounded-xl border border-[#bef264]/20 bg-[#bef264]/[0.05] px-3 py-2.5 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-[#bef264]/80 uppercase">
            Every flip syncs to the cloud + rebuilds the site — no Seed needed
          </p>
        </div>
      </div>
      {/* Payment rails — each rail independent, site is read-only */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
          <BadgeCheck className="h-3.5 w-3.5 text-[#25d366]" aria-hidden="true" />
          Payment rails · independent — active green · soon amber · off locked (never hidden)
        </p>
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.06em] text-white/35 uppercase">
          Dashboard only — visitors never edit. Each rail flips alone, availability badge untouched.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <span className="flex h-11 w-24 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
              <span className="relative block h-full w-full">
                <Image
                  src="/icons/vodafone.svg"
                  alt=""
                  fill
                  sizes="88px"
                  className="object-contain"
                />
              </span>
            </span>
            <TriState value={db.settings.vodafoneState} onPick={(v) => set("vodafoneState", v)} />
            <Field label="Wallet number" hint="appears on the site">
              <input
                value={db.settings.vodafoneNumber}
                onChange={(e) => set("vodafoneNumber", e.target.value)}
                dir="ltr"
                inputMode="tel"
                placeholder="01065228072"
                className={inputCls}
                maxLength={20}
              />
            </Field>
            {db.settings.vodafoneState === "soon" && (
              <DeadlineInput
                label="Available on"
                value={db.settings.vodafoneAt}
                onChange={(v) => set("vodafoneAt", v)}
              />
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <span className="flex h-11 w-24 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
              <span className="relative block h-full w-full">
                <Image
                  src="/icons/taptapsend.png"
                  alt=""
                  fill
                  sizes="88px"
                  className="object-contain"
                />
              </span>
            </span>
            <TriState value={db.settings.taptapState} onPick={(v) => set("taptapState", v)} />
            <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-white/40 uppercase">
              Sends to <span className="text-white/70 tabular-nums" dir="ltr">{db.settings.vodafoneNumber || "—"}</span> · no extra setup
            </p>
            {db.settings.taptapState === "soon" && (
              <DeadlineInput
                label="Available on"
                value={db.settings.taptapAt}
                onChange={(v) => set("taptapAt", v)}
              />
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <span className="flex h-11 w-24 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
              <span className="relative block h-full w-full">
                <Image
                  src="/icons/InstaPay.png"
                  alt=""
                  fill
                  sizes="88px"
                  className="object-contain"
                />
              </span>
            </span>
            <TriState value={db.settings.instapayState} onPick={(v) => set("instapayState", v)} />
            <Field label="InstaPay handle" hint="@user or mobile">
              <input
                value={db.settings.instapayHandle}
                onChange={(e) => set("instapayHandle", e.target.value)}
                dir="ltr"
                placeholder="@budi or 010…"
                className={inputCls}
                maxLength={60}
              />
            </Field>
            {db.settings.instapayState === "soon" && (
              <DeadlineInput
                label="Available on"
                value={db.settings.instapayAt}
                onChange={(v) => set("instapayAt", v)}
              />
            )}
          </div>
        </div>
      </div>
      {/* Verification seals — fixed BUDI seal + your own extra badges */}
      <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/[0.03] p-6">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-sky-300/80 uppercase">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verification · fixed site seal + extra seals
        </p>
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.06em] text-white/35 uppercase">
          Dashboard only — contact identity, footer + project cards read these. Visitors never edit.
        </p>
        <div className="mt-4">
          <Toggle
            checked={db.settings.siteVerified !== false}
            onChange={(v) => set("siteVerified", v)}
            label="Site seal — Verified · BUDI with logo"
            desc="Fixed badge beside your name in Contact + footer. Toggle off hides it everywhere."
          />
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
              Extra seals · {(db.settings.verificationBadges ?? []).length}
            </p>
            <button
              type="button"
              onClick={() =>
                set("verificationBadges", [
                  ...(db.settings.verificationBadges ?? []),
                  { id: uid("seal"), labelEn: "", labelFr: "", logo: "" },
                ])
              }
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.12em] text-sky-300 uppercase transition-colors hover:bg-sky-400/20"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add seal
            </button>
          </div>
          {(db.settings.verificationBadges ?? []).length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-white/15 px-4 py-4 text-center text-xs text-white/40">
              No extra seals — add e.g. “Identity Verified” / “Top Rated Freelancer”.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {(db.settings.verificationBadges ?? []).map((b, i) => (
                <div key={b.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={`Seal ${i + 1} (EN)`} hint="badge text">
                      <input
                        value={b.labelEn}
                        onChange={(e) => {
                          const next = [...(db.settings.verificationBadges ?? [])];
                          next[i] = { ...next[i]!, labelEn: e.target.value.slice(0, 60) };
                          set("verificationBadges", next);
                        }}
                        placeholder="Identity Verified"
                        className={inputCls}
                        maxLength={60}
                      />
                    </Field>
                    <Field label={`Seal ${i + 1} (FR)`} hint="texte du badge">
                      <input
                        value={b.labelFr}
                        onChange={(e) => {
                          const next = [...(db.settings.verificationBadges ?? [])];
                          next[i] = { ...next[i]!, labelFr: e.target.value.slice(0, 60) };
                          set("verificationBadges", next);
                        }}
                        placeholder="Identité vérifiée"
                        className={inputCls}
                        maxLength={60}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <Field label="Logo (optional)" hint="path or URL">
                        <input
                          value={b.logo}
                          onChange={(e) => {
                            const next = [...(db.settings.verificationBadges ?? [])];
                            next[i] = { ...next[i]!, logo: e.target.value.trim().slice(0, 200) };
                            set("verificationBadges", next);
                          }}
                          placeholder="/icons/verified.svg or https://…"
                          className={inputCls}
                          maxLength={200}
                          dir="ltr"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "verificationBadges",
                          (db.settings.verificationBadges ?? []).filter((x) => x.id !== b.id),
                        )
                      }
                      aria-label={`Delete seal ${i + 1}`}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
            <Database className="h-3.5 w-3.5 text-[#a78bfa]" aria-hidden="true" />
            Backup & restore
          </p>
          <p className="font-mono text-[9px] tracking-[0.08em] text-white/30">
            JSON snapshot of this browser — Push sends it to the cloud
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doExport}
              className="flex cursor-pointer items-center gap-2 border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#ff3d00] hover:text-[#ff3d00]"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#ff3d00] hover:text-[#ff3d00]"
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Import backup file"
              onChange={(e) => doImport(e.target.files?.[0])}
            />
          </div>
        </div>

      {/* Session — who holds the keys right now */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#38bdf8]/40 bg-[#38bdf8]/10 shadow-[0_0_28px_rgba(56,189,248,0.3)]">
          <ShieldCheck className="h-7 w-7 text-[#38bdf8]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#38bdf8]/80 uppercase">
            Admin session
          </p>
          <p className="font-display mt-1 text-xl font-bold text-white">Signed in on this tab</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            PIN gate passed · secret lives in sessionStorage — closing the tab locks the console.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogoutTab}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>

      {/* Danger zone — destructive, no undo */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 shadow-[0_0_28px_rgba(239,68,68,0.3)]">
            <Trash2 className="h-7 w-7 text-red-400" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.3em] text-red-400/80 uppercase">
              Danger zone
            </p>
            <p className="font-display mt-1 text-xl font-bold text-white">Destructive actions</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Likes clear this browser only · Reset restores demo content locally.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.removeItem("budi-likes");
                } catch {
                  /* ignore */
                }
                window.alert("Likes cleared on this browser.");
              }}
              className="cursor-pointer rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-red-500 hover:text-red-400"
            >
              Clear likes
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.removeItem(skillLikesKey());
                } catch {
                  /* ignore */
                }
                window.alert("Skill likes cleared on this browser.");
              }}
              className="cursor-pointer rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-red-500 hover:text-red-400"
            >
              Clear skill likes
            </button>
            <button
              type="button"
              onClick={onReset}
              className="cursor-pointer rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- editors -------------------------------- */

function ServiceEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: AdminService | null;
  onClose: () => void;
  onSave: (item: AdminService, keepOpen?: boolean) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<AdminService>(
    initial ?? {
      id: uid("srv"),
      title: "",
      titleFr: "",
      desc: "",
      descFr: "",
      tags: [],
      points: [],
      pointsFr: [],
      category: "development",
      bestForEn: CATEGORY_DEFAULTS.development.bestForEn,
      bestForFr: CATEGORY_DEFAULTS.development.bestForFr,
      timelineEn: CATEGORY_DEFAULTS.development.timelineEn,
      timelineFr: CATEGORY_DEFAULTS.development.timelineFr,
      icon: "",
      iconImage: "",
      visible: true,
    },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof AdminService>(k: K, v: AdminService[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors([]);
  };
  const lines = (s: string): string[] =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  const applyDefaults = (cat: ServiceCategory): void => {
    const d = CATEGORY_DEFAULTS[cat];
    setForm((f) => ({
      ...f,
      category: cat,
      bestForEn: d.bestForEn,
      bestForFr: d.bestForFr,
      timelineEn: d.timelineEn,
      timelineFr: d.timelineFr,
    }));
    setErrors([]);
  };
  const save = (): void => {
    const res = validate(serviceSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      try {
        Sentry.captureMessage(`Admin blocked invalid service save: ${res.errors.join(" | ")}`, "warning");
      } catch {
        /* ignore */
      }
      return;
    }
    onSave({ ...form, title: form.title.trim() });
  };
  /** Save & start another in the same category — rapid entry, no reopening. */
  const saveMore = (): void => {
    const res = validate(serviceSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    const keepCat = form.category;
    const d = CATEGORY_DEFAULTS[keepCat];
    onSave({ ...form, title: form.title.trim() }, true);
    setForm({
      id: uid("srv"),
      title: "",
      titleFr: "",
      desc: "",
      descFr: "",
      tags: [],
      points: [],
      pointsFr: [],
      category: keepCat,
      bestForEn: d.bestForEn,
      bestForFr: d.bestForFr,
      timelineEn: d.timelineEn,
      timelineFr: d.timelineFr,
      icon: "",
      iconImage: "",
      visible: true,
    });
    setErrors([]);
  };
  const catAccent = CAT_STYLE[form.category]?.bg ?? "#38bdf8";
  return (
    <Modal title={initial ? "Edit service" : "New service"} subtitle="What the client buys · live site preview inside" icon={Briefcase} accent={catAccent} onClose={onClose} wide>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(CAT_STYLE) as ServiceCategory[]).map((c) => {
          const meta = CAT_STYLE[c];
          const active = form.category === c;
          const Icon = meta.icon;
          return (
            <button
              key={c}
              type="button"
              onClick={() => applyDefaults(c)}
              aria-pressed={active}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5",
                active ? "border-transparent" : "border-white/10 bg-white/[0.02] hover:border-white/30",
              )}
              style={active ? { backgroundColor: `${meta.bg}22`, borderColor: `${meta.bg}88`, boxShadow: `0 0 20px ${meta.bg}44` } : undefined}
            >
              <Icon className="h-5 w-5" style={{ color: active ? meta.bg : "rgba(255,255,255,0.5)" }} aria-hidden="true" />
              <span className={cn("font-mono text-[10px] font-black tracking-[0.12em] uppercase", active ? "text-white" : "text-white/50")}>{CAT_LABEL[c]}</span>
            </button>
          );
        })}
      </div>
      {form.title && (
        <ServiceMiniPreview
          title={form.title}
          category={form.category}
          tags={form.tags}
          points={form.points}
          visible={form.visible}
          accent={catAccent}
          icon={form.icon}
          iconImage={form.iconImage}
        />
      )}
      <div className="mb-4">
        <Field
          label="Icon — library code or external link"
          hint={form.icon !== "" ? `library: ${form.icon}` : form.iconImage !== "" ? "custom image" : "category default"}
        >
          <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{ backgroundColor: catAccent, color: "#140b04" }}
              >
                {form.iconImage !== "" ? (
                  <span className="relative block h-full w-full p-1">
                    <SmartImage src={form.iconImage} alt="" fill fit="contain" sizes="48px" />
                  </span>
                ) : (
                  (() => {
                    const Picked = libIcon(form.icon);
                    const Fallback = CAT_STYLE[form.category]?.icon ?? Globe;
                    const Show = Picked ?? Fallback;
                    return <Show className="h-5 w-5" aria-hidden="true" />;
                  })()
                )}
              </span>
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/50">
                {form.icon !== ""
                  ? "Library icon wins — it renders on the site card."
                  : form.iconImage !== ""
                    ? "Custom image renders on the site card."
                    : "Empty = the category icon. Pick a library code or paste an image link."}
              </p>
              {(form.icon !== "" || form.iconImage !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    set("icon", "");
                    set("iconImage", "");
                  }}
                  className="shrink-0 cursor-pointer font-mono text-[9px] tracking-[0.08em] text-white/30 uppercase transition-colors hover:text-red-400"
                >
                  Reset
                </button>
              )}
            </div>
            <LibIconPicker
              value={form.icon}
              accent={catAccent}
              onPick={(name) => {
                set("icon", name);
                if (name !== "") set("iconImage", "");
              }}
            />
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
              <input
                value={form.iconImage}
                onChange={(e) => {
                  set("iconImage", e.target.value.trim());
                  if (e.target.value.trim() !== "") set("icon", "");
                }}
                dir="ltr"
                placeholder="/icons/… or https://… (external image link)"
                className={cn(inputCls, "pl-10")}
                maxLength={2000}
              />
            </div>
          </div>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" hint={`${form.title.length}/80`}>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Full-Stack Web Development" className={inputCls} maxLength={80} />
        </Field>
        <Field label="Title (FR)" hint={`${form.titleFr.length}/80`}>
          <input value={form.titleFr} onChange={(e) => set("titleFr", e.target.value)} placeholder="Titre en français" className={inputCls} maxLength={80} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description — sells the service" hint={`${form.desc.length}/400`}>
            <textarea value={form.desc} onChange={(e) => set("desc", e.target.value)} rows={2} placeholder="One strong promise + stack + outcome…" className={inputCls} maxLength={400} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description (FR)" hint={`${form.descFr.length}/400`}>
            <textarea value={form.descFr} onChange={(e) => set("descFr", e.target.value)} rows={2} placeholder="La même promesse, en français…" className={inputCls} maxLength={400} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Tags — stack chips on the card" hint={`${form.tags.length}/12`}>
            <input
              value={form.tags.join(", ")}
              onChange={(e) => set("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
              placeholder="Next.js, TypeScript, Node.js"
              className={inputCls}
            />
          </Field>
          {form.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.tags.map((t) => {
                const logo = techLogo(t);
                return (
                  <span key={t} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold text-white/65 uppercase">
                    {logo && <Image src={logo} alt="" width={14} height={14} className="block h-3.5 w-3.5" />}
                    {t}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <Field label="Best for (EN)">
          <input value={form.bestForEn} onChange={(e) => set("bestForEn", e.target.value)} placeholder="Startups & SaaS founders" className={inputCls} maxLength={80} />
        </Field>
        <Field label="Best for (FR)">
          <input value={form.bestForFr} onChange={(e) => set("bestForFr", e.target.value)} placeholder="Startups & fondateurs SaaS" className={inputCls} maxLength={80} />
        </Field>
        <Field label="Timeline (EN)">
          <input value={form.timelineEn} onChange={(e) => set("timelineEn", e.target.value)} placeholder="1–4 weeks · weekly demos" className={inputCls} maxLength={80} />
        </Field>
        <Field label="Timeline (FR)">
          <input value={form.timelineFr} onChange={(e) => set("timelineFr", e.target.value)} placeholder="1–4 semaines · démos hebdo" className={inputCls} maxLength={80} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Deliverables — one per line" hint={`${form.points.length}/10`}>
            <textarea value={form.points.join("\n")} onChange={(e) => set("points", lines(e.target.value))} rows={3} placeholder={"End-to-end product builds\nAuth, dashboards & roles\nDeploy pipelines included"} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Deliverables FR — one per line" hint={`${form.pointsFr.length}/10`}>
            <textarea value={form.pointsFr.join("\n")} onChange={(e) => set("pointsFr", lines(e.target.value))} rows={3} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Toggle checked={form.visible} onChange={(v) => set("visible", v)} label={form.visible ? "LIVE — shows on the site" : "HIDDEN — draft only"} desc="The eye is REAL: saving publishes (or hides) this service on the live site instantly." />
        </div>
        <div className="sm:col-span-2">
          <FormErrors errors={errors} />
          <button
            type="button"
            onClick={save}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: catAccent, color: "#140b04", boxShadow: `0 16px 40px -16px ${catAccent}88` }}
          >
            <Check className="h-4 w-4" />
            {initial ? "Save changes — syncs to cloud" : "Publish service — goes live"}
          </button>
          {!initial && (
            <button
              type="button"
              onClick={saveMore}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Save + add another
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function SkillEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: AdminSkill | null;
  onClose: () => void;
  onSave: (item: AdminSkill, keepOpen?: boolean) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<AdminSkill>(
    initial ?? {
      id: uid("skill"),
      name: "",
      cat: "frontend",
      level: 70,
      proof: "learning",
      logo: "",
      icon: "",
      detailEn: "",
      detailFr: "",
      visible: true,
    },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof AdminSkill>(k: K, v: AdminSkill[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors([]);
  };
  const save = (): void => {
    const res = validate(skillSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    onSave({ ...form, name: form.name.trim() });
  };
  /** Save & start another in the same category — rapid entry, no reopening. */
  const saveMore = (): void => {
    const res = validate(skillSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    const keepCat = form.cat;
    onSave({ ...form, name: form.name.trim() }, true);
    setForm({
      id: uid("skill"),
      name: "",
      cat: keepCat,
      level: 70,
      proof: "learning",
      logo: "",
      icon: "",
      detailEn: "",
      detailFr: "",
      visible: true,
    });
    setErrors([]);
  };
  const levelColor = LEVEL_COLOR[levelKeyOf(form.level)] ?? "#d7fd44";
  const catColor = SKILL_CAT_META[form.cat]?.color ?? "#d7fd44";
  return (
    <Modal title={initial ? "Edit skill" : "New skill"} subtitle="Mastery + proof + projects = complete site card" icon={Cpu} accent={levelColor} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {form.name && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
            {(() => {
              const Picked = libIcon(form.icon);
              if (Picked) {
                return (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10" style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}>
                    <Picked className="h-6 w-6" aria-hidden="true" />
                  </span>
                );
              }
              if (form.logo) {
                return (
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/50 p-1.5">
                    <span className="relative block h-full w-full">
                      <SmartImage src={form.logo} alt="" fill fit="contain" sizes="44px" />
                    </span>
                  </span>
                );
              }
              return (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 font-mono text-xs font-black">
                  {form.name.slice(0, 2).toUpperCase()}
                </span>
              );
            })()}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{form.name}</p>
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: levelColor }}>
                {levelTag(form.level)} · {form.level}/100 · {SKILL_CAT_META[form.cat]?.label}
              </p>
            </div>
            <LiveBadge visible={form.visible} />
          </div>
        )}
        <Field label="Skill name" hint={`${form.name.length}/40`}>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Redis, Docker, Supabase…" className={inputCls} maxLength={40} />
        </Field>
        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">Category — where it lives on the site</span>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SKILL_CAT_META) as AdminSkill["cat"][]).map((c) => {
              const meta = SKILL_CAT_META[c];
              const active = form.cat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("cat", c)}
                  aria-pressed={active}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5",
                    active ? "" : "border-white/10 bg-white/[0.02] hover:border-white/30",
                  )}
                  style={active ? { borderColor: `${meta.color}88`, backgroundColor: `${meta.color}1a`, boxShadow: `0 0 20px ${meta.color}44` } : undefined}
                >
                  <span className="mx-auto block h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className={cn("mt-1.5 block text-xs font-black", active ? "text-white" : "text-white/55")}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Field label={`Mastery — ${form.level}/100 · ${levelTag(form.level)}`} hint="85+ Expert · 70+ Advanced">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <input type="range" min={10} max={100} value={form.level} onChange={(e) => set("level", Number(e.target.value))} className="w-full" style={{ accentColor: levelColor }} aria-label="Mastery level" />
            <div className="mt-2.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => i < Math.round(form.level / 20)).map((on, i) => (
                <span key={i} className="h-1.5 flex-1 rounded-full" style={on ? { backgroundColor: levelColor, boxShadow: `0 0 10px ${levelColor}66` } : { backgroundColor: "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          </div>
        </Field>
        <div>
          <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">Proof — why should an HR believe it?</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PROOF_LABEL) as AdminSkill["proof"][]).map((p) => {
              const ProofIcon = PROOF_ICON[p];
              const active = form.proof === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("proof", p)}
                  aria-pressed={active}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5",
                    active ? "border-[#ff3d00]/70 bg-[#ff3d00]/10 shadow-[0_0_18px_rgba(255,61,0,0.3)]" : "border-white/10 bg-white/[0.02] hover:border-white/30",
                  )}
                >
                  <ProofIcon className={cn("h-4 w-4 shrink-0", active ? "text-[#ff3d00]" : "text-white/40")} aria-hidden="true" />
                  <span className={cn("text-xs font-bold", active ? "text-white" : "text-white/60")}>{PROOF_LABEL[p]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
              Library code — lucide icon, wins over the image
            </span>
            {form.icon !== "" && (
              <button
                type="button"
                onClick={() => set("icon", "")}
                className="cursor-pointer font-mono text-[9px] tracking-[0.08em] text-white/30 uppercase transition-colors hover:text-red-400"
              >
                Clear
              </button>
            )}
          </span>
          <LibIconPicker
            value={form.icon}
            accent={catColor}
            onPick={(name) => {
              set("icon", name);
              if (name !== "") set("logo", "");
            }}
          />
          {form.icon !== "" && (
            <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-emerald-300/70 uppercase">
              ✓ Library: {form.icon} — renders on the site card instead of the image
            </p>
          )}
        </div>
        <Field label="Logo image — presets or external link" hint="SVG path or https URL">
          <div className="grid grid-cols-6 gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
            {LOGO_PRESETS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  set("logo", form.logo === src ? "" : src);
                  if (form.logo !== src) set("icon", "");
                }}
                aria-label={src}
                title={src.split("/").pop()}
                className={cn(
                  "flex h-12 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5",
                  form.logo === src
                    ? "border-[#ff3d00] bg-[#ff3d00]/12 shadow-[0_0_16px_rgba(255,61,0,0.45)]"
                    : "border-white/10 bg-white/[0.04] hover:border-white/30",
                )}
              >
                <Image src={src} alt="" width={26} height={26} className="block h-6 w-6" />
              </button>
            ))}
          </div>
          <input
            value={form.logo}
            onChange={(e) => {
              set("logo", e.target.value);
              if (e.target.value.trim() !== "") set("icon", "");
            }}
            placeholder="/icons/tech/custom.svg or https://…"
            dir="ltr"
            className={cn(inputCls, "mt-2")}
            maxLength={160}
          />
        </Field>
        <Field label="Detail (EN) — one line that sells" hint={`${form.detailEn.length}/220`}>
          <textarea value={form.detailEn} onChange={(e) => set("detailEn", e.target.value)} rows={2} placeholder="e.g. Queues, caching and pub/sub in production." className={inputCls} maxLength={220} />
        </Field>
        <Field label="Detail (FR)" hint={`${form.detailFr.length}/220`}>
          <textarea value={form.detailFr} onChange={(e) => set("detailFr", e.target.value)} rows={2} placeholder="La même ligne, en français…" className={inputCls} maxLength={220} />
        </Field>
        <Toggle checked={form.visible} onChange={(v) => set("visible", v)} label={form.visible ? "LIVE — shows on the site" : "HIDDEN — draft only"} desc="Tip: after saving, add this skill to 1–2 project stacks — the site card then shows × projects + score automatically." />
        <FormErrors errors={errors} />
        <button
          type="button"
          onClick={save}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: catColor, color: "#140b04", boxShadow: `0 16px 40px -16px ${catColor}88` }}
        >
          <Check className="h-4 w-4" />
          {initial ? "Save changes — syncs to cloud" : `Add to ${SKILL_CAT_META[form.cat]?.label} — goes live`}
        </button>
        {!initial && (
          <button
            type="button"
            onClick={saveMore}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Save + add another
          </button>
        )}
      </div>
    </Modal>
  );
}

function ProjectEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: AdminProject | null;
  onClose: () => void;
  onSave: (item: AdminProject, keepOpen?: boolean) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<AdminProject>(
    initial ?? {
      id: uid("proj"),
      title: "",
      titleFr: "",
      desc: "",
      descFr: "",
      tech: [],
      status: "in-progress",
      opensource: false,
      category: "",
      github: "",
      period: "",
      year: String(new Date().getFullYear()),
      demo: "",
      image: "",
      roleEn: "",
      roleFr: "",
      timelineEn: "",
      timelineFr: "",
      briefEn: [],
      briefFr: [],
      sponsored: false,
      visible: true,
    },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof AdminProject>(k: K, v: AdminProject[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors([]);
  };
  const lines = (s: string): string[] =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  const save = (): void => {
    const res = validate(projectSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    onSave({ ...form, title: form.title.trim() });
  };
  /** Save & start another in the same category + status — rapid entry. */
  const saveMore = (): void => {
    const res = validate(projectSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    const keepCat = form.category;
    const keepStatus = form.status;
    onSave({ ...form, title: form.title.trim() }, true);
    setForm({
      id: uid("proj"),
      title: "",
      titleFr: "",
      desc: "",
      descFr: "",
      tech: [],
      status: keepStatus,
      opensource: false,
      category: keepCat,
      github: "",
      period: "",
      year: String(new Date().getFullYear()),
      demo: "",
      image: "",
      roleEn: "",
      roleFr: "",
      timelineEn: "",
      timelineFr: "",
      briefEn: [],
      briefFr: [],
      sponsored: false,
      visible: true,
    });
    setErrors([]);
  };
  return (
    <Modal title={initial ? "Edit project" : "New project"} subtitle="Stack feeds every skill score · links close the deal" icon={FolderGit} accent="#ff3d00" onClose={onClose} wide>
      {form.title && (
        <ProjectMiniPreview
          title={form.title}
          tech={form.tech}
          status={form.status}
          visible={form.visible}
          image={form.image}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} maxLength={80} />
        </Field>
        <Field label="Title (FR)">
          <input value={form.titleFr} onChange={(e) => set("titleFr", e.target.value)} className={inputCls} maxLength={80} />
        </Field>
        <Field label="Category">
          <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="SaaS / Dashboard…" className={inputCls} maxLength={40} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea value={form.desc} onChange={(e) => set("desc", e.target.value)} rows={2} className={inputCls} maxLength={400} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description (FR)">
            <textarea value={form.descFr} onChange={(e) => set("descFr", e.target.value)} rows={2} className={inputCls} maxLength={400} />
          </Field>
        </div>
        <Field label="Tech (comma separated)">
          <input value={form.tech.join(", ")} onChange={(e) => set("tech", lines(e.target.value.replace(/,/g, "\n")))} placeholder="React, Next.js, …" className={inputCls} />
        </Field>
        <Field label="Year">
          <input value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} maxLength={9} />
        </Field>
        <Field label="Period (e.g. 01/2024 — 06/2024)">
          <input value={form.period} onChange={(e) => set("period", e.target.value)} className={inputCls} maxLength={40} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value as AdminProject["status"])} className={cn(inputCls, "bg-black")}>
            <option value="completed">Completed</option>
            <option value="in-progress">In progress</option>
          </select>
        </Field>
        <Field label="GitHub URL">
          <input value={form.github} onChange={(e) => set("github", e.target.value)} dir="ltr" className={inputCls} maxLength={200} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Live demo URL (empty = Demo soon)">
            <input value={form.demo} onChange={(e) => set("demo", e.target.value)} dir="ltr" placeholder="https://…" className={inputCls} maxLength={200} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <ImageUploadField
            label="Cover image — upload or paste"
            hint="empty = default cover art"
            value={form.image}
            onChange={(v) => set("image", v)}
            pastePlaceholder="/images/projects/… or https://…"
          />
        </div>
        <Field label="Role (EN)">
          <input value={form.roleEn} onChange={(e) => set("roleEn", e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Role (FR)">
          <input value={form.roleFr} onChange={(e) => set("roleFr", e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Timeline (EN)">
          <input value={form.timelineEn} onChange={(e) => set("timelineEn", e.target.value)} placeholder="6 weeks" className={inputCls} maxLength={80} />
        </Field>
        <Field label="Timeline (FR)">
          <input value={form.timelineFr} onChange={(e) => set("timelineFr", e.target.value)} placeholder="6 semaines" className={inputCls} maxLength={80} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Case brief EN (one point per line)">
            <textarea value={form.briefEn.join("\n")} onChange={(e) => set("briefEn", lines(e.target.value))} rows={3} className={inputCls} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Case brief FR (one point per line)">
            <textarea value={form.briefFr.join("\n")} onChange={(e) => set("briefFr", lines(e.target.value))} rows={3} className={inputCls} />
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <Toggle checked={form.opensource} onChange={(v) => set("opensource", v)} label="Open source" desc="Shows the Open Source badge on the site card." />
          <Toggle checked={form.sponsored} onChange={(v) => set("sponsored", v)} label="★ Sponsored by BUDI" desc="Proof badge with logo on the project card." />
          <Toggle checked={form.visible} onChange={(v) => set("visible", v)} label={form.visible ? "LIVE — shows on the site" : "HIDDEN — draft only"} desc="REAL sync: saving publishes (or hides) this project live." />
        </div>
        <div className="flex flex-col justify-end gap-3">
          <FormErrors errors={errors} />
          <button
            type="button"
            onClick={save}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff3d00] px-4 py-4 text-sm font-black text-[#1a0e05] shadow-[0_16px_40px_-16px_rgba(255,61,0,0.55)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <Check className="h-4 w-4" />
            {initial ? "Save changes — syncs to cloud" : "Publish project — goes live"}
          </button>
          {!initial && (
            <button
              type="button"
              onClick={saveMore}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Save + add another
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CertEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: AdminCert | null;
  onClose: () => void;
  onSave: (item: AdminCert, keepOpen?: boolean) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<AdminCert>(
    initial ?? {
      id: uid("cert"),
      titleEn: "",
      titleFr: "",
      issuerEn: "",
      issuerFr: "",
      year: String(new Date().getFullYear()),
      months: 6,
      code: "",
      skills: [],
      image: "",
      verify: "",
      visible: true,
    },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const set = <K extends keyof AdminCert>(k: K, v: AdminCert[K]): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors([]);
  };
  const save = (): void => {
    const res = validate(certSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    onSave({ ...form, titleEn: form.titleEn.trim() });
  };
  /** Save & start another from the same issuer — rapid entry, no reopening. */
  const saveMore = (): void => {
    const res = validate(certSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    const keepIssuer = form.issuerEn;
    onSave({ ...form, titleEn: form.titleEn.trim() }, true);
    setForm({
      id: uid("cert"),
      titleEn: "",
      titleFr: "",
      issuerEn: keepIssuer,
      issuerFr: "",
      year: String(new Date().getFullYear()),
      months: 6,
      code: "",
      skills: [],
      image: "",
      verify: "",
      visible: true,
    });
    setErrors([]);
  };
  return (
    <Modal title={initial ? "Edit certificate" : "New certificate"} subtitle="Proof that closes deals · verify link required" icon={Award} accent="#a78bfa" onClose={onClose} wide>
      {form.titleEn && (
        <CertMiniPreview
          titleEn={form.titleEn}
          issuerEn={form.issuerEn}
          year={form.year}
          visible={form.visible}
          image={form.image}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (EN)">
          <input value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inputCls} maxLength={90} />
        </Field>
        <Field label="Title (FR)">
          <input value={form.titleFr} onChange={(e) => set("titleFr", e.target.value)} className={inputCls} maxLength={90} />
        </Field>
        <Field label="Issuer (EN)">
          <input value={form.issuerEn} onChange={(e) => set("issuerEn", e.target.value)} className={inputCls} maxLength={60} />
        </Field>
        <Field label="Issuer (FR)">
          <input value={form.issuerFr} onChange={(e) => set("issuerFr", e.target.value)} className={inputCls} maxLength={60} />
        </Field>
        <Field label="Year">
          <input value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} maxLength={9} />
        </Field>
        <Field label="Duration (months)">
          <input
            type="number"
            min={1}
            max={60}
            value={form.months}
            onChange={(e) => set("months", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Credential ID">
          <input value={form.code} onChange={(e) => set("code", e.target.value)} className={inputCls} maxLength={40} />
        </Field>
        <Field label="Skills (comma separated)">
          <input value={form.skills.join(", ")} onChange={(e) => set("skills", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} className={inputCls} />
        </Field>
        <Field label="Verify URL (empty = soon)">
          <input value={form.verify} onChange={(e) => set("verify", e.target.value)} dir="ltr" className={inputCls} maxLength={200} />
        </Field>
        <div className="flex items-center">
          <Toggle checked={form.visible} onChange={(v) => set("visible", v)} label={form.visible ? "LIVE — shows on the site" : "HIDDEN — draft only"} desc="REAL sync: saving publishes (or hides) this credential live." />
        </div>
        <div className="sm:col-span-2">
          <ImageUploadField
            label="Certificate image — upload or paste"
            hint="JPG/PNG ≤10MB · SVG ok · empty = placeholder"
            value={form.image}
            onChange={(v) => set("image", v)}
            pastePlaceholder="/images/certificates/… or https://…"
          />
        </div>
        <div className="sm:col-span-2">
          <FormErrors errors={errors} />
          <button
            type="button"
            onClick={save}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 py-4 text-sm font-black text-[#1a0e05] shadow-[0_16px_40px_-16px_rgba(167,139,250,0.55)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <Check className="h-4 w-4" />
            {initial ? "Save changes — syncs to cloud" : "Publish certificate — goes live"}
          </button>
          {!initial && (
            <button
              type="button"
              onClick={saveMore}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Save + add another
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
