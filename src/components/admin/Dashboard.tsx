"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  CircleCheck,
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
  Gift,
  Globe,
  GraduationCap,
  HardDrive,
  Hash,
  Heart,
  Hourglass,
  ImagePlus,
  Info,
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
  Rocket,
  Route,
  Search,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { skillProjectUsage } from "@/lib/skill-usage";
import { grantBirthdayPreview } from "@/lib/birthday";
import Logo from "@/components/Logo";
import { availabilityFromSettings, formatBadgeDate, workDeadlineSuffix, workLabel } from "@/components/WorkStatus";
import { logout } from "./Login";
import { type Workspace } from "./workspaces";
import {
  bumpVisit,
  catDisplayLabel,
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
  setStoreNamespace,
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
import { TECH_PRESETS } from "@/data/techPresets";
import { LIB_ICON_CHOICES, LIB_ICONS, libIcon } from "@/lib/brandIcons";
import TechPicker from "./TechPicker";
import TranslateEnFr from "./TranslateEnFr";
import { TOAST_EVENT, notify, type ToastMsg } from "./toasts";
import SuggestCopy from "./SuggestCopy";
import CategoryManager from "./CategoryManager";
import PrayerTimes from "./PrayerTimes";
import Appointments from "./Appointments";
import NotificationsInbox from "./NotificationsInbox";
import ReminderEngine from "./ReminderEngine";
import YearCalendar from "./YearCalendar";
import SmartImage from "@/components/SmartImage";
import { VERSES } from "@/data/verses";
import { personal } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import {
  ApiError,
  adminSecret,
  deployPunch,
  deployStatus,
  fetchSnapshot,
  remoteRemove,
  remoteSave,
  remoteSeed,
  requestRevalidate,
  type DeployStatus,
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
                if (!window.confirm("Delete this image? The card falls back to its default art.")) return;
                onChange("");
                setErr(null);
              }}
              title="Delete image"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.08em] text-red-300 uppercase transition-all hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Delete image
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

/** Tech-logo quick pick — real brand marks from the top-50 pool, searchable.
 *  One tap sets the image path, tapping again clears. Replaces the generic
 *  icon grid: services and skills now wear real tech logos that also render
 *  on the site cards (stored as image paths). */
function TechLogoPicker({
  value,
  onPick,
  accent,
}: {
  value: string;
  onPick: (logo: string) => void;
  accent: string;
}): React.JSX.Element {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const items = TECH_PRESETS.filter(
    (p) => p.logo !== "" && (query === "" || p.name.toLowerCase().includes(query)),
  );
  return (
    <div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/30" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brand marks…"
          aria-label="Search brand marks"
          className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/35"
        />
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 p-3 text-center text-xs text-white/40">
          No brand mark matches — paste a custom image link below.
        </p>
      ) : (
        <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2.5 sm:grid-cols-8" role="group" aria-label="Tech logos">
          {items.map((p) => {
            const active = value === p.logo;
            return (
              <button
                key={p.name}
                type="button"
                title={p.name}
                aria-label={`Tech logo ${p.name}`}
                aria-pressed={active}
                onClick={() => onPick(active ? "" : p.logo)}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-lg border bg-white p-1 transition-all duration-200 hover:-translate-y-0.5",
                  active ? "border-transparent" : "border-white/10 hover:border-white/40",
                )}
                style={active ? { borderColor: `${accent}88`, boxShadow: `0 0 14px ${accent}66` } : undefined}
              >
                <span className="relative block h-7 w-7">
                  <SmartImage src={p.logo} alt="" fill fit="contain" sizes="28px" />
                </span>
              </button>
            );
          })}
        </div>
      )}
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

/**
 * Chic toast stack — non-blocking feedback that replaces window.alert.
 * Errors glow red for 9s (role=alert), wins/info fade in 4.5s. Listens on
 * the budi-toast bus so any console piece can notify without prop drilling.
 */
function ToastStack(): React.JSX.Element {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const onToast = (ev: Event): void => {
      const msg = (ev as CustomEvent<ToastMsg>).detail;
      if (!msg || typeof msg.title !== "string") return;
      setItems((prev) => [...prev.slice(-3), msg]);
      window.setTimeout(
        () => {
          setItems((prev) => prev.filter((t) => t.id !== msg.id));
        },
        msg.kind === "err" ? 9000 : 4500,
      );
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return (): void => {
      window.removeEventListener(TOAST_EVENT, onToast);
    };
  }, []);
  if (items.length === 0) return <></>;
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[140] flex w-[min(92vw,360px)] flex-col gap-2">
      {items.map((t) => {
        const Icon = t.kind === "err" ? TriangleAlert : t.kind === "ok" ? CircleCheck : Info;
        const ring =
          t.kind === "err"
            ? "border-red-500/50 shadow-[0_18px_50px_-12px_rgba(239,68,68,0.55)]"
            : t.kind === "ok"
              ? "border-emerald-400/40 shadow-[0_18px_50px_-12px_rgba(52,211,153,0.45)]"
              : "border-sky-400/40 shadow-[0_18px_50px_-12px_rgba(56,189,248,0.45)]";
        const glow =
          t.kind === "err" ? "text-red-400" : t.kind === "ok" ? "text-emerald-300" : "text-sky-300";
        return (
          <div
            key={t.id}
            role={t.kind === "err" ? "alert" : "status"}
            className={`animate-modal-pop pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[#131316]/95 p-4 backdrop-blur-xl ${ring}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${glow}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">{t.title}</p>
              {t.body && <p className="mt-1 text-xs leading-relaxed break-words text-white/60">{t.body}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Giza night — pyramid-blue canvas with a whisper of gold. Static by design
 * (motion-safe, zero cost): glass cards float above it, readability untouched.
 * Three pyramids + a moon disc drawn in faint gold over a deep-blue sky.
 */
const GIZA_STARS: { l: string; t: string; s: number; o: number }[] = [
  { l: "6%", t: "8%", s: 2, o: 0.7 },
  { l: "12%", t: "22%", s: 1.5, o: 0.5 },
  { l: "18%", t: "6%", s: 2, o: 0.8 },
  { l: "24%", t: "30%", s: 1.5, o: 0.4 },
  { l: "31%", t: "12%", s: 2, o: 0.7 },
  { l: "38%", t: "26%", s: 1.5, o: 0.45 },
  { l: "44%", t: "7%", s: 2.5, o: 0.85 },
  { l: "52%", t: "18%", s: 1.5, o: 0.5 },
  { l: "58%", t: "5%", s: 2, o: 0.75 },
  { l: "63%", t: "28%", s: 1.5, o: 0.4 },
  { l: "70%", t: "10%", s: 2, o: 0.7 },
  { l: "76%", t: "24%", s: 1.5, o: 0.5 },
  { l: "82%", t: "6%", s: 2.5, o: 0.85 },
  { l: "88%", t: "20%", s: 1.5, o: 0.55 },
  { l: "93%", t: "10%", s: 2, o: 0.7 },
  { l: "97%", t: "30%", s: 1.5, o: 0.4 },
  { l: "3%", t: "38%", s: 1.5, o: 0.35 },
  { l: "48%", t: "34%", s: 1.5, o: 0.35 },
];

function GizaBackdrop(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0b1a33 0%, #081426 42%, #0a1224 68%, #0c1425 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[30vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(56,130,248,0.12), transparent 65%)",
        }}
      />
      {GIZA_STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#f9edb0]"
          style={{
            left: s.l,
            top: s.t,
            width: s.s,
            height: s.s,
            opacity: s.o,
            boxShadow: "0 0 6px rgba(249,237,176,0.8)",
          }}
        />
      ))}
      <div
        className="absolute inset-x-0 bottom-0 h-[48vh]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 108%, rgba(212,175,55,0.14), transparent 65%)",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-[30vh] w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.25)" strokeWidth="1.5">
          <polygon points="80,320 180,208 280,320" opacity="0.7" />
          <polygon points="380,320 620,76 860,320" />
          <polygon points="830,320 1020,128 1210,320" />
          <polygon points="1212,320 1300,190 1388,320" opacity="0.8" />
        </g>
        <g stroke="rgba(249,237,176,0.14)" strokeWidth="1">
          <line x1="620" y1="76" x2="620" y2="320" />
          <line x1="1020" y1="128" x2="1020" y2="320" />
          <line x1="180" y1="208" x2="180" y2="320" />
          <line x1="1300" y1="190" x2="1300" y2="320" />
        </g>
        <circle cx="1150" cy="66" r="26" fill="rgba(249,237,176,0.10)" />
        <circle
          cx="1150"
          cy="66"
          r="26"
          fill="none"
          stroke="rgba(249,237,176,0.28)"
          strokeWidth="1.5"
        />
      </svg>
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(180deg, transparent, rgba(8,20,38,0.9))" }}
      />
    </div>
  );
}

/**
 * "اضرب يا بودي" — the big glowing punch: repo status + one-tap
 * commit-and-push to GitHub. Vercel (wired to the same repo) builds and
 * ships the production domain by itself right after — the card says so.
 * Server does the git work (gated + rate-limited + audited); this is UI.
 */
function DeployCard(): React.JSX.Element {
  const [status, setStatus] = useState<DeployStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [punching, setPunching] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    // No secret, no request: firing an unauthenticated status check would
    // only stain the console red. Real logins always carry the secret.
    if (adminSecret().trim() === "") {
      setStatus({ ok: true, git: false, reason: "No session secret — log in again to arm the punch." });
      return;
    }
    setChecking(true);
    try {
      const s = await deployStatus();
      setStatus(s);
      setResult(null);
    } catch (e: unknown) {
      notify("err", "Deploy status unreachable", e instanceof Error ? e.message : "unreachable");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const punch = (): void => {
    if (punching) return;
    const n = status?.dirty ?? 0;
    if (!window.confirm(`Punch ${n} file(s) to GitHub now? This commits + pushes everything.`)) return;
    setPunching(true);
    setResult(null);
    void deployPunch()
      .then(async (res) => {
        if (res.clean) {
          setResult(res.message ?? "Tree already clean — nothing to punch.");
          notify("info", "Nothing to punch", "Tree already clean.");
        } else {
          setResult(res.message ?? `Pushed ${res.files ?? 0} file(s) (${res.hash ?? ""}).`);
          notify(
            "ok",
            "Punched to GitHub",
            `${res.files ?? 0} file(s) · ${res.hash ?? ""} · Vercel ships the domain next.`,
          );
          try {
            await requestRevalidate();
          } catch {
            /* local purge is best-effort */
          }
        }
        await refresh();
      })
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "unreachable";
        setResult(msg);
        notify("err", "Punch failed", msg);
      })
      .finally(() => {
        setPunching(false);
      });
  };

  const dirty = status?.dirty ?? 0;
  const canPunch = !!status?.git && dirty > 0 && !checking && !punching;
  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#ff3d00]/30 bg-gradient-to-br from-[#ff3d00]/[0.08] via-transparent to-[#d4af37]/[0.07] p-6">
      <span
        aria-hidden="true"
        className="animate-spin-conic absolute inset-[-70%] m-auto h-[240%] w-[45%] opacity-25"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, #ff3d00 15%, #d7fd44 30%, transparent 45%, transparent 60%, #d4af37 75%, transparent 90%)",
          filter: "blur(18px)",
        }}
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#ff3d00]/50 bg-[#ff3d00]/10 shadow-[0_0_40px_rgba(255,61,0,0.4)]">
          <Rocket className="h-8 w-8 text-[#ff8a5c]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#ff8a5c]/80 uppercase">
            Ship center · GitHub ⇄ production domain
          </p>
          <p dir="rtl" lang="ar" className="font-display mt-1 text-3xl font-black tracking-tight text-white">
            اضرب يا بودي
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Commits + pushes every change to GitHub in one punch — Vercel rebuilds and ships the domain by
            itself right after.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase" aria-live="polite">
            {checking || !status ? (
              <span className="text-white/40">Reading repo…</span>
            ) : !status.git ? (
              <span className="text-amber-300">{status.reason ?? "git unavailable on this server"}</span>
            ) : (
              <>
                <span className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-white/70">
                  {status.branch} · {dirty} file{dirty === 1 ? "" : "s"} dirty
                </span>
                {status.lastCommit && (
                  <span className="max-w-full truncate rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-white/50" title={`${status.lastCommit.hash} · ${status.lastCommit.subject}`}>
                    {status.lastCommit.hash} · {status.lastCommit.subject.slice(0, 48)}
                  </span>
                )}
                {status.ahead !== null && status.ahead !== undefined && status.ahead > 0 && (
                  <span className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-2 py-1 text-sky-300">
                    {status.ahead} ahead — punch it
                  </span>
                )}
              </>
            )}
          </div>
          {result && (
            <p className="mt-2 max-w-full truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70" title={result}>
              {result}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={punch}
            disabled={!canPunch}
            title={dirty === 0 ? "Tree clean — nothing to push" : `Commit + push ${dirty} file(s) to GitHub now`}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3d00] to-[#ff7a00] px-8 py-4 text-base font-black text-[#1a0e05] shadow-[0_16px_50px_-12px_rgba(255,61,0,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Rocket className={cn("h-5 w-5", punching && "animate-bounce")} aria-hidden="true" />
            {punching ? "Punching…" : "Punch it"}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={checking || punching}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-white/60 uppercase transition-colors hover:border-white/35 hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", checking && "animate-spin")} aria-hidden="true" />
            {checking ? "Reading…" : "Refresh status"}
          </button>
        </div>
      </div>
      {status?.git === true && dirty > 0 && (status.files?.length ?? 0) > 0 && (
        <div className="relative mt-4 max-h-28 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[10px] leading-relaxed text-white/45" dir="ltr">
          {status.files!.slice(0, 12).map((f) => (
            <p key={f} className="truncate">
              {f}
            </p>
          ))}
          {(status.files?.length ?? 0) > 12 && <p>…+{(status.files?.length ?? 0) - 12} more</p>}
        </div>
      )}
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
      // Chic + loud: toast the owner AND leave one clean console line.
      // (No noise otherwise — the monitor panel keeps the full history.)
      notify("err", "Runtime error trapped", msg.slice(0, 200));
      // Dev-only console line — prod stays silent (toast + Sentry carry it).
      if (process.env.NODE_ENV !== "production") {
        try {
          console.error("%cBUDI console — runtime error trapped", "color:#ff5d5d;font-weight:bold", msg);
        } catch {
          /* console unavailable */
        }
      }
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
      notify("err", "Unhandled rejection trapped", msg.slice(0, 200));
      // Dev-only console line — prod stays silent (toast + Sentry carry it).
      if (process.env.NODE_ENV !== "production") {
        try {
          console.error("%cBUDI console — unhandled rejection", "color:#ff5d5d;font-weight:bold", msg);
        } catch {
          /* console unavailable */
        }
      }
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
  workspaces,
  onQuickOpen,
  isMainConsole,
  workspaceMotto,
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
  /** Full account registry for the fast console switcher (logo per account). */
  workspaces?: Workspace[];
  /** Jump straight into another console (loader → PIN), no hub round-trip. */
  onQuickOpen?: (id: string) => void;
  /** True only for the BUDI Portfolio console (owns verses rotation + cloud). */
  isMainConsole?: boolean;
  /** This account's own opening verse (hub-owned). Null = none set yet. */
  workspaceMotto?: { ar: string; en: string; ref: string } | null;
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
    // SELF-SUFFICIENT isolation: pin the storage namespace to THIS console
    // before touching any data. Relying on a module var set by a previous
    // screen is what let one account wake up inside another's database
    // (reloads, remounts, future flows). Empty id → fail closed (own key).
    if (workspaceId) setStoreNamespace(workspaceId);
    setDb(loadDB());
    try {
      if (!sessionStorage.getItem("budi-visit-counted")) {
        sessionStorage.setItem("budi-visit-counted", "1");
        bumpVisit();
      }
    } catch {
      /* ignore */
    }
    // workspaceId is fixed for the mounted console (parent remounts per
    // account via key) — never re-runs, just satisfies exhaustive-deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

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
      notify("info", "Local workspace — cloud seeding is off", "Data stays in this browser.");
      return;
    }
    const current = dbRef.current;
    if (!current || seeding) return;
    setSeeding(true);
    void remoteSeed(current)
      .then((res) => {
        notify(
          "ok",
          "Database seeded",
          `${res.seeded?.services ?? 0} services · ${res.seeded?.skills ?? 0} skills · ${res.seeded?.projects ?? 0} projects · ${res.seeded?.certs ?? 0} certs. The site rebuilds instantly — open any preview to see it.`,
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
    logout();
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
   * (logged in before the server env changed). Toast it, then bounce back
   * to the PIN screen for a fresh login. Everything else becomes a chic
   * red toast (auto-dismiss) + a styled console line — never a nagging
   * blocking alert, never silent.
   */
  const syncFailed = (e: unknown, prefix: string): void => {
    if (e instanceof ApiError && e.status === 401) {
      notify("err", "Session expired — logging you out", "Log in again with the current PIN.");
      doLogout();
      return;
    }
    const msg = e instanceof Error ? e.message : "unreachable";
    notify("err", `${prefix}cloud sync failed`, msg);
    // Dev-only console line — prod stays silent (toast carries it).
    if (process.env.NODE_ENV !== "production") {
      try {
        console.error("%cBUDI console — cloud sync failed", "color:#ff5d5d;font-weight:bold", `${prefix}${msg}`);
      } catch {
        /* console unavailable */
      }
    }
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
      notify("info", "Local workspace — cloud push is off", "Data stays in this browser.");
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
    notify(
      "ok",
      "Pushed to cloud",
      `${res.seeded?.services ?? 0} services · ${res.seeded?.skills ?? 0} skills · ${res.seeded?.projects ?? 0} projects · ${res.seeded?.certs ?? 0} certs. Site rebuilt instantly.`,
    );
  };

  /** Pull the cloud snapshot over the local DB — "make this screen == cloud". */
  const doPullAll = async (): Promise<void> => {
    if (!CLOUD) {
      notify("info", "Local workspace — cloud pull is off", "Data stays in this browser.");
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
      notify("info", "Cloud is empty — nothing to pull", "Push first.");
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
    notify("ok", "Pulled cloud snapshot", "Dashboard now mirrors the live site.");
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
      notify("info", "Nothing matches — nothing changed.");
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

  /** Rename a free-form group value (project category / cert issuer):
   *  every matching row is rewritten locally + re-saved to the cloud. */
  const renameGroupValue = (kind: "projects" | "certs", from: string, to: string): void => {
    const clean = to.trim().slice(0, 60);
    if (clean === "" || clean === from) return;
    const key = kind === "projects" ? "category" : "issuerEn";
    const current = dbRef.current;
    if (!current) return;
    const targets = (current[kind] as unknown as Record<string, unknown>[]).filter(
      (x) => (x[key] as string) === from,
    );
    if (targets.length === 0) return;
    if (!window.confirm(`Rename "${from}" to "${clean}" on ${targets.length} items?${CLOUD ? " Cloud syncs too." : ""}`)) return;
    patch((d) => {
      for (const x of d[kind] as unknown as Record<string, unknown>[]) {
        if ((x[key] as string) === from) x[key] = clean;
      }
    });
    if (!CLOUD) return;
    for (const t of targets) {
      void remoteSave(kind, { ...t, [key]: clean }).catch((e: unknown) => {
        syncFailed(e, "Renamed locally — ");
      });
    }
  };

  /** Rename a fixed-enum category's CONSOLE label (services/skills).
   *  The site enum never changes — only this console's display names. */
  const renameCatLabel = (section: "service" | "skill", value: string, label: string): void => {
    const clean = label.trim().slice(0, 60);
    if (clean === "") return;
    const current = dbRef.current;
    if (!current) return;
    handleSettingsChange({
      ...current.settings,
      catLabels: { ...(current.settings.catLabels ?? {}), [`${section}:${value}`]: clean },
    });
  };

  /** Safe project-category delete — moves items to a fallback instead of
   *  wiping them (the inventory bulk-delete removes items permanently). */
  const moveProjectCategory = (from: string, to: string): void => {
    const current = dbRef.current;
    if (!current) return;
    const targets = current.projects.filter((p) => p.category === from);
    if (targets.length === 0) return;
    if (!window.confirm(`Delete category "${from}" but KEEP its ${targets.length} project(s)? They move to "${to === "" ? "General (uncategorized)" : to}".`)) return;
    patch((d) => {
      for (const p of d.projects) {
        if (p.category === from) p.category = to;
      }
    });
    if (!CLOUD) return;
    for (const t of targets) {
      void remoteSave("projects", { ...t, category: to }).catch((e: unknown) => {
        syncFailed(e, "Moved locally — ");
      });
    }
  };

  /** Busted preview URL — recomputed every render, so the Hard button's
   *  nonce instantly swaps the iframe to a cache-free document. */
  const previewSrc = preview === null ? "" : bustPreview(preview, previewNonce);

  return (
    <div className="relative isolate flex min-h-svh bg-[#081426] text-white">
      <GizaBackdrop />
      {/* Sidebar */}
      <aside className="fixed inset-x-0 top-0 z-[110] border-b border-white/10 bg-[#0a1526]/95 backdrop-blur-xl lg:inset-y-0 lg:right-auto lg:w-60 lg:border-r lg:border-b-0">
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
              <Fragment key={item.id}>
                {item.id === "services" && (
                  <p className="mt-1 hidden shrink-0 px-3 font-mono text-[9px] tracking-[0.28em] text-white/30 uppercase lg:block">
                    Supporting sections
                  </p>
                )}
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
              </Fragment>
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
            <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <p className="font-mono text-[9px] tracking-[0.24em] text-white/35 uppercase">
                Switch console
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(workspaces ?? []).map((ws) => {
                  const active = ws.id === workspaceId;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        if (!active) onQuickOpen?.(ws.id);
                      }}
                      title={`${ws.name} — switch console`}
                      aria-label={`Switch to ${ws.name}`}
                      aria-current={active ? "true" : undefined}
                      className="relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: `${ws.theme}66`,
                        backgroundColor: ws.logo !== "" ? "#ffffff" : `${ws.theme}14`,
                        boxShadow: active
                          ? `0 0 0 2px #0a0a0b, 0 0 0 4px ${ws.theme}, 0 0 18px ${ws.theme}88`
                          : `0 0 10px ${ws.theme}33`,
                      }}
                    >
                      {ws.logo !== "" ? (
                        <span className="relative block h-full w-full p-1">
                          <SmartImage src={ws.logo} alt="" fill fit="contain" sizes="40px" />
                        </span>
                      ) : (
                        <span className="scale-[0.8] text-white">
                          <Logo />
                        </span>
                      )}
                      {ws.kind === "external" && (
                        <span
                          aria-hidden="true"
                          className="absolute right-0.5 bottom-0.5 h-1.5 w-1.5 rounded-full bg-sky-400"
                          style={{ boxShadow: "0 0 6px rgba(56,189,248,0.9)" }}
                        />
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={onSwitchAccount}
                  title={workspaceName ? `All dashboards (now in ${workspaceName})` : "All dashboards (hub)"}
                  aria-label="All dashboards"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 text-white/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:text-white"
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
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
              motto={workspaceMotto ?? null}
              isMain={isMainConsole !== false}
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
              onRenameCat={(s, v, l) => renameCatLabel(s, v, l)}
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
              onRenameCat={(s, v, l) => renameCatLabel(s, v, l)}
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
              onRenameValue={(f, t) => renameGroupValue("projects", f, t)}
              onSafeDelete={(f, t) => moveProjectCategory(f, t)}
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
              onRenameValue={(f, t) => renameGroupValue("certs", f, t)}
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
          labels={db.settings.catLabels}
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
          labels={db.settings.catLabels}
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
          suggestions={db.skills.map((s) => s.name)}
          categories={[...new Set(db.projects.map((p) => p.category.trim()).filter((c) => c !== ""))].sort((a, b) => a.localeCompare(b))}
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
          suggestions={db.skills.map((s) => s.name)}
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
      <ToastStack />
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

/**
 * Opening verse — every console speaks with its own voice:
 * a hub-owned motto renders statically; the main console rotates the
 * shared verses (mirror of the site footer's daily verse); any other
 * console without a motto shows a setup hint instead of borrowed text.
 */
function VerseRotator({
  motto,
  isMain,
}: {
  motto: { ar: string; en: string; ref: string } | null;
  isMain: boolean;
}): React.JSX.Element {
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

  if (motto) {
    return (
      <figure className="relative overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.07] via-transparent to-[#ff3d00]/[0.07] p-6 text-center lg:col-span-3">
        <Quote className="mx-auto h-5 w-5 text-[#d7fd44]" aria-hidden="true" />
        <blockquote dir="rtl" lang="ar" className="mt-2 text-xl leading-loose text-white sm:text-2xl">
          {motto.ar !== "" ? motto.ar : motto.en}
        </blockquote>
        {motto.ar !== "" && motto.en !== "" && (
          <figcaption className="mt-2 text-xs leading-relaxed text-white/60 italic">
            &ldquo;{motto.en}&rdquo;
          </figcaption>
        )}
        {motto.ref !== "" && (
          <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">
            {motto.ref}
          </p>
        )}
        <p className="mt-2 font-mono text-[9px] tracking-[0.22em] text-[#d7fd44]/60 uppercase">
          This console&apos;s opening verse
        </p>
      </figure>
    );
  }

  if (!isMain) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center lg:col-span-3">
        <BookOpen className="mx-auto h-5 w-5 text-white/30" aria-hidden="true" />
        <p className="mt-2 text-sm font-bold text-white/70">No opening verse yet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/45">
          Give this console its own voice — set an opening verse from the hub
          (edit this account) and it appears here instead of borrowed text.
        </p>
      </div>
    );
  }

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
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/[0.10] via-transparent to-rose-400/[0.08] p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 90% 10%, rgba(251,191,36,0.14), transparent 60%), radial-gradient(ellipse 40% 60% at 5% 95%, rgba(212,175,55,0.10), transparent 60%)",
        }}
      />
      {/* Magic shine sweep */}
      <span aria-hidden="true" className="club-shine pointer-events-none absolute inset-y-0 left-0 w-1/2" />
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="relative shrink-0">
          <span className="relative block h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#d4af37]/70 shadow-[0_0_36px_rgba(212,175,55,0.55)]">
            <Image
              src="/images/profile/contact.jpg"
              alt="Mohamed Abdallah"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </span>
          <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#d4af37] text-[13px] shadow-[0_0_12px_rgba(212,175,55,0.9)]">
            🎂
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#f9edb0]/80 uppercase">
            Birthday countdown · 24 October ♥
          </p>
          <p className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">
            {isToday && nowMs !== null ? (
              <>It&apos;s today — Mohamed turns {turning}! 🎉</>
            ) : (
              <>Mohamed turns {turning} in…</>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              grantBirthdayPreview(15);
              try {
                window.open("/birthday", "_blank", "noopener,noreferrer");
              } catch {
                /* popup blocked */
              }
            }}
            className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#d4af37] px-4 py-2 text-xs font-black text-[#2b2305] shadow-[0_10px_30px_-10px_rgba(212,175,55,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            افتح هديتك · Open your gift
          </button>
          <p className="mt-1.5 font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase">
            Dashboard preview only — locked for visitors until Oct 24
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
  motto,
  isMain,
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
  motto: { ar: string; en: string; ref: string } | null;
  isMain: boolean;
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
      {totalItems === 0 && (
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#d7fd44]/30 bg-gradient-to-br from-[#d7fd44]/[0.07] via-transparent to-[#4ade80]/[0.06] p-6 text-center sm:p-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#d7fd44] to-transparent"
          />
          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7fd44]/40 bg-[#d7fd44]/10 shadow-[0_0_30px_rgba(215,253,68,0.25)]">
            <Sparkles className="h-6 w-6 text-[#d7fd44]" aria-hidden="true" />
          </span>
          <p className="relative mt-4 font-mono text-[10px] tracking-[0.3em] text-[#d7fd44]/80 uppercase">
            Fresh console · Empty dashboard
          </p>
          <h3 className="font-display relative mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Welcome to your new console
          </h3>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
            This dashboard has no content yet — no services, skills, projects or
            certificates. Everything you add here stays isolated in this account.
          </p>
          <div className="relative mt-5 grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
            {(
              [
                { id: "services" as Tab, label: "Add service", icon: Briefcase, color: "#38bdf8" },
                { id: "skills" as Tab, label: "Add skill", icon: Cpu, color: "#d7fd44" },
                { id: "projects" as Tab, label: "Add project", icon: FolderGit, color: "#ff3d00" },
                { id: "certs" as Tab, label: "Add certificate", icon: Award, color: "#a78bfa" },
              ]
            ).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onTab(a.id)}
                className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${a.color}1f`, color: a.color }}
                >
                  <a.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold text-white/80 group-hover:text-white">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Home quick-jump — long page, organized in one tap */}
      <nav aria-label="Home sections" className="mb-4 flex flex-wrap gap-1.5">
        {[
          { id: "home-badges", label: "Badges" },
          { id: "home-identity", label: "Identity" },
          { id: "home-planner", label: "Planner" },
          { id: "home-stats", label: "Stats" },
          { id: "home-progress", label: "Progress" },
          { id: "home-data", label: "Data" },
          { id: "home-preview", label: "Preview" },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="cursor-pointer rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white/55 uppercase transition-colors hover:border-[#d7fd44]/50 hover:text-[#d7fd44]"
          >
            {s.label}
          </button>
        ))}
      </nav>
      {/* Needs attention — thin spots across every section, one tap to fix */}
      {(() => {
        const thinServices = db.services.filter((s) => s.desc.trim() === "" || s.tags.length === 0);
        const coverlessProjects = db.projects.filter((p) => p.image.trim() === "");
        const unverifiedCerts = db.certs.filter((c) => c.verify.trim() === "");
        const flatSkills = db.skills.filter((s) => s.detailEn.trim() === "" && s.detailFr.trim() === "");
        const rows = [
          { tab: "services" as Tab, label: "Services missing desc/tags", items: thinServices.map((s) => s.title || s.id), color: "#38bdf8", icon: Briefcase },
          { tab: "projects" as Tab, label: "Projects without cover art", items: coverlessProjects.map((p) => p.title || p.id), color: "#ff3d00", icon: FolderGit },
          { tab: "certs" as Tab, label: "Certificates without verify link", items: unverifiedCerts.map((c) => c.titleEn || c.id), color: "#a78bfa", icon: Award },
          { tab: "skills" as Tab, label: "Skills without detail", items: flatSkills.map((s) => s.name || s.id), color: "#d7fd44", icon: Cpu },
        ];
        const total = rows.reduce((n, r) => n + r.items.length, 0);
        if (total === 0) return null;
        return (
          <div className="relative mb-4 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.06] via-transparent to-transparent p-6">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-amber-300/80 uppercase">
                  Needs attention · {total} item{total === 1 ? "" : "s"}
                </p>
                <h3 className="font-display mt-1 text-2xl font-black tracking-tight">
                  Polish these to shine
                </h3>
              </div>
            </div>
            <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
              {rows
                .filter((r) => r.items.length > 0)
                .map((r) => (
                  <button
                    key={r.tab}
                    type="button"
                    onClick={() => onTab(r.tab)}
                    title={`Open ${r.tab}`}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black"
                      style={{ backgroundColor: `${r.color}1f`, color: r.color }}
                    >
                      {r.items.length}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white/85 group-hover:text-white">
                        {r.label}
                      </span>
                      <span className="block truncate text-[11px] text-white/40">
                        {r.items.slice(0, 3).join(" · ")}
                        {r.items.length > 3 ? ` +${r.items.length - 3} more` : ""}
                      </span>
                    </span>
                    <r.icon className="h-4 w-4 shrink-0 text-white/30 group-hover:text-white" aria-hidden="true" />
                  </button>
                ))}
            </div>
          </div>
        );
      })()}
      {/* Badges command — every site badge driven from here */}
      <div id="home-badges" className="relative mb-4 scroll-mt-24 overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.06] via-transparent to-[#ff3d00]/[0.06] p-6">
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
                      className="block h-[20px] w-[48px] object-contain"
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
      <div id="home-identity" className="grid scroll-mt-24 gap-3 lg:grid-cols-5">
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

        <VerseRotator motto={motto} isMain={isMain} />
      </div>

      <BirthdayCountdown />

      {/* Notifications — owner's bell: inbox + push + reminders engine */}
      <div className="mt-4">
        <NotificationsInbox />
        <ReminderEngine />
      </div>

      {/* Day planner — year calendar + appointments + Suez prayer times */}
      <h3 id="home-planner" className="font-display mt-8 scroll-mt-24 text-lg font-bold">Day planner</h3>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <YearCalendar />
        <div className="flex flex-col gap-3">
          <Appointments />
          <PrayerTimes />
        </div>
      </div>

      {/* Quick counters */}
      <h3 id="home-stats" className="font-display mt-8 scroll-mt-24 text-lg font-bold">Quick stats</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} value={visits} label="Visitors" accent />
        <StatCard icon={Heart} value={likesTotal} label="Project likes" color="#fb7185" />
        <StatCard icon={Eye} value={visibleItems} label="Live items" color="#d7fd44" />
        <StatCard icon={Database} value={totalItems} label="Items in DB" />
      </div>

      {/* Site progress per section */}
      <h3 id="home-progress" className="font-display mt-8 scroll-mt-24 text-lg font-bold">Site progress</h3>
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
      <h3 id="home-data" className="font-display mt-8 scroll-mt-24 text-lg font-bold">Database</h3>
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
      <div id="home-preview" className="mt-8 flex scroll-mt-24 flex-wrap items-baseline justify-between gap-2">
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
 *  control (filter · add inside · rename · publish all · hide all · delete
 *  group) plus an inline "new category" creator when the section allows
 *  free-form groups (projects, issuers). Shared by all four sections so
 *  classification works identically. */
function InventoryGrid<T extends string>({
  title,
  groups,
  active,
  onFilter,
  onAddIn,
  onBulk,
  onRename,
  onAddCategory,
  allowSystemRename = true,
}: {
  title: string;
  groups: { id: T; label: string; color: string; total: number; live: number; extra?: string }[];
  active: T | "all";
  onFilter: (id: T | "all") => void;
  onAddIn: (id: T) => void;
  onBulk: (id: T, action: "delete" | "show" | "hide") => void;
  /** Rename a group's display name (or value for free-form sections). */
  onRename?: (id: T, label: string) => void;
  /** Create a brand-new category (free-form sections only). */
  onAddCategory?: (name: string) => void;
  /** False hides the pencil on the "__none__" catch-all group. */
  allowSystemRename?: boolean;
}): React.JSX.Element | null {
  const [renaming, setRenaming] = useState<T | null>(null);
  const [draft, setDraft] = useState("");
  const [newCat, setNewCat] = useState("");
  if (groups.length === 0 && !onAddCategory) return null;
  const commitRename = (id: T): void => {
    const clean = draft.trim().slice(0, 60);
    if (clean !== "" && onRename) onRename(id, clean);
    setRenaming(null);
    setDraft("");
  };
  const commitAdd = (): void => {
    const clean = newCat.trim().slice(0, 60);
    if (clean === "" || !onAddCategory) return;
    onAddCategory(clean);
    setNewCat("");
  };
  return (
    <div className="relative mt-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-white/50 uppercase">
          <Layers className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
          {title} — inventory
        </p>
        {onAddCategory && (
          <span className="ml-auto flex items-center gap-1.5">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value.slice(0, 60))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAdd();
                }
              }}
              placeholder="New category…"
              aria-label="New category name"
              maxLength={60}
              className="w-36 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/40"
            />
            <button
              type="button"
              onClick={commitAdd}
              title="Create category"
              className="cursor-pointer rounded-lg border border-[#d7fd44]/40 bg-[#d7fd44]/10 px-2.5 py-1.5 font-mono text-[10px] font-black tracking-[0.08em] text-[#d7fd44] uppercase transition-colors hover:bg-[#d7fd44]/20"
            >
              + New
            </button>
          </span>
        )}
      </div>
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
                {renaming === g.id ? (
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <input
                      value={draft}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value.slice(0, 60))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitRename(g.id);
                        } else if (e.key === "Escape") {
                          setRenaming(null);
                          setDraft("");
                        }
                      }}
                      aria-label={`Rename ${g.label}`}
                      maxLength={60}
                      className="min-w-0 flex-1 rounded-lg border border-white/30 bg-black/50 px-2 py-1 text-sm font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => commitRename(g.id)}
                      aria-label="Save name"
                      className="shrink-0 cursor-pointer rounded-lg border border-emerald-400/50 bg-emerald-400/10 p-1.5 text-emerald-300 hover:bg-emerald-400/20"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenaming(null);
                        setDraft("");
                      }}
                      aria-label="Cancel rename"
                      className="shrink-0 cursor-pointer rounded-lg border border-white/15 p-1.5 text-white/50 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onFilter(isActive ? "all" : g.id)}
                    title={isActive ? "Show all" : `Filter to ${g.label}`}
                    className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-bold transition-colors hover:text-white"
                  >
                    {g.label}
                  </button>
                )}
                {onRename && renaming !== g.id && (allowSystemRename || g.id !== "__none__") && (
                  <button
                    type="button"
                    onClick={() => {
                      setRenaming(g.id);
                      setDraft(g.label);
                    }}
                    title={`Rename ${g.label}`}
                    aria-label={`Rename ${g.label}`}
                    className="shrink-0 cursor-pointer rounded-lg border border-transparent p-1.5 text-white/30 transition-colors hover:border-white/25 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
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
  onRenameCat,
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
  onRenameCat: (section: "service" | "skill", value: string, label: string) => void;
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
      label: catDisplayLabel(db.settings.catLabels, "service", c, CAT_LABEL[c]),
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
          onRename={(id, label) => onRenameCat("service", id, label)}
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
                    {catDisplayLabel(db.settings.catLabels, "service", s.category, CAT_LABEL[s.category])}
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
  onRenameCat,
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
  onRenameCat: (section: "service" | "skill", value: string, label: string) => void;
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
      label: catDisplayLabel(db.settings.catLabels, "skill", c, SKILL_CAT_META[c].label),
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
          onRename={(id, label) => onRenameCat("skill", id, label)}
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
                    {catDisplayLabel(db.settings.catLabels, "skill", s.cat, catMeta.label)}
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
  onRenameValue,
  onSafeDelete,
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
  onRenameValue: (from: string, to: string) => void;
  onSafeDelete: (from: string, to: string) => void;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "in-progress">("all");
  const [pcat, setPcat] = useState<string>("all");
  const [sort, setSort] = useState<"curated" | "newest" | "az" | "loved">("curated");
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
  const loveOf = (p: AdminProject): number => likes[p.github || p.title] ?? 0;
  const sorted = [...filtered].sort((a, b) =>
    sort === "newest"
      ? yearNum(b.year) - yearNum(a.year)
      : sort === "az"
        ? a.title.localeCompare(b.title)
        : sort === "loved"
          ? loveOf(b) - loveOf(a)
          : 0,
  );
  const live = db.projects.filter((p) => p.visible).length;
  const oss = db.projects.filter((p) => p.opensource).length;
  const blankProject = (category: string): AdminProject => ({
    id: uid("proj"),
    title: "",
    titleFr: "",
    desc: "",
    descFr: "",
    tech: [],
    status: "in-progress",
    opensource: false,
    category,
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
                { id: "loved", label: "Most loved" },
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
        <>
        <InventoryGrid
          title="Categories"
          groups={groups}
          active={pcat}
          onFilter={setPcat}
          onAddIn={(id) => onEdit(blankProject(id === "__none__" ? "" : id))}
          onBulk={(id, action) =>
            onBulk((x) => inGroup(x as unknown as AdminProject, id), action)
          }
          onRename={(id, label) => {
            if (id !== "__none__") onRenameValue(id, label);
          }}
          onAddCategory={(name) => onEdit(blankProject(name))}
        />
        <div className="mt-3">
          <CategoryManager
            title="Safe category cleanup"
            hint="Delete a category WITHOUT losing projects — items move to a fallback"
            categories={cats.map((c) => ({ name: c, count: db.projects.filter((p) => p.category === c).length }))}
            accent="#ff3d00"
            onRename={(a, b) => onRenameValue(a, b)}
            onDelete={(name, moveTo) => onSafeDelete(name, moveTo)}
            onAdd={(name) => onEdit(blankProject(name))}
          />
        </div>
        </>
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

/** Credential freshness from the year stamp — honest age, never a fake expiry. */
function certFreshness(year: string): { label: string; cls: string } | null {
  const m = year.match(/(19|20)\d{2}/);
  if (!m) return null;
  const age = new Date().getFullYear() - Number(m[0]);
  if (age <= 1)
    return {
      label: `${m[0]} · Fresh`,
      cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    };
  if (age <= 3)
    return {
      label: `${m[0]} · ${age}y ago`,
      cls: "border-sky-400/40 bg-sky-400/10 text-sky-300",
    };
  return {
    label: `${m[0]} · Vintage`,
    cls: "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#e9ce7a]",
  };
}

/** Journey span — first to latest credential year, e.g. 2019 → 2026. */
function certYearSpan(certs: AdminCert[]): string | null {
  const years = certs
    .map((c) => c.year.match(/(19|20)\d{2}/)?.[0])
    .filter((y): y is string => !!y)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length === 0) return null;
  const first = years[0]!;
  const last = years[years.length - 1]!;
  return first === last ? `${first} · 1 yr of proof` : `${first} → ${last} · ${last - first + 1} yrs of proof`;
}

/**
 * Journey timeline — the career path in gold: credentials grouped by year on
 * a glowing rail, newest first. Compact rows jump straight to the editor;
 * the eye flips visibility without leaving the timeline.
 */
function JourneyTimeline({
  groups,
  onEdit,
  onToggle,
}: {
  groups: { year: string; items: AdminCert[] }[];
  onEdit: (item: AdminCert) => void;
  onToggle: (id: string) => void;
}): React.JSX.Element {
  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/40">
        No credentials on this journey yet.
      </p>
    );
  }
  return (
    <ol className="relative ml-2 border-l-2 border-[#d4af37]/40 pl-6">
      {groups.map((g) => (
        <li key={g.year} className="relative pb-7 last:pb-1">
          <span
            aria-hidden="true"
            className="absolute top-1 -left-[33px] h-3.5 w-3.5 rounded-full border-2 border-[#d4af37] bg-[#081426] shadow-[0_0_14px_rgba(212,175,55,0.8)]"
          />
          <p className="font-mono text-sm font-black tracking-[0.3em] text-[#e9ce7a]">
            {g.year}
            <span className="ml-2 text-[10px] font-bold text-white/35">
              {g.items.length} credential{g.items.length === 1 ? "" : "s"}
            </span>
          </p>
          <ul className="mt-3 space-y-2">
            {g.items.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-black/30 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5",
                  c.visible
                    ? "border-white/10 hover:border-[#d4af37]/50"
                    : "border-dashed border-white/15 opacity-60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  title={`Edit ${c.titleEn || c.id}`}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <span className="block truncate text-sm font-bold text-white/90 group-hover:text-white">
                    {c.titleEn || "(untitled)"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-white/40">
                    {c.issuerEn || "Unknown issuer"}
                    {c.verify ? " · verified" : " · no verify link"}
                  </span>
                </button>
                {c.verify ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-white/25" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={() => onToggle(c.id)}
                  title={c.visible ? "Hide from site" : "Publish to site"}
                  aria-label={c.visible ? `Hide ${c.titleEn}` : `Publish ${c.titleEn}`}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-[#d4af37]/60 hover:text-[#e9ce7a]"
                >
                  {c.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/** Freshness chip — credential age at a glance (Fresh / N yrs ago / Vintage). */
function FreshChip({ year }: { year: string }): React.JSX.Element | null {
  const f = certFreshness(year);
  if (!f) return null;
  return (
    <span className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${f.cls}`}>
      <Hourglass className="h-3 w-3" aria-hidden="true" />
      {f.label}
    </span>
  );
}

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
  onRenameValue,
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
  onRenameValue: (from: string, to: string) => void;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [issuer, setIssuer] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "issuer">("newest");
  const [view, setView] = useState<"cards" | "journey">("cards");
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
      : sort === "oldest"
        ? yearNum(a.year) - yearNum(b.year)
        : a.issuerEn.localeCompare(b.issuerEn),
  );
  const live = db.certs.filter((c) => c.visible).length;
  const journeySpan = certYearSpan(db.certs);
  /** Golden path — filtered certs grouped by year, newest year first. */
  const journeyGroups = useMemo(() => {
    const byYear = new Map<string, AdminCert[]>();
    for (const c of sorted) {
      const y = c.year.match(/(19|20)\d{2}/)?.[0] ?? "Undated";
      const list = byYear.get(y) ?? [];
      list.push(c);
      byYear.set(y, list);
    }
    return [...byYear.entries()]
      .map(([year, items]) => ({ year, items }))
      .sort((a, b) => (a.year === "Undated" ? 1 : b.year === "Undated" ? -1 : Number(b.year) - Number(a.year)));
  }, [sorted]);
  const unverified = db.certs.filter((c) => !c.verify).length;
  const verifiedPct =
    db.certs.length === 0
      ? 0
      : Math.round(((db.certs.length - unverified) / db.certs.length) * 100);
  const blankCert = (issuer: string): AdminCert => ({
    id: uid("cert"),
    titleEn: "",
    titleFr: "",
    issuerEn: issuer,
    issuerFr: "",
    year: String(new Date().getFullYear()),
    months: 6,
    code: "",
    skills: [],
    image: "",
    verify: "",
    verifyLogo: "",
    visible: true,
  });
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
                { id: "oldest", label: "Oldest" },
                { id: "issuer", label: "Issuer A–Z" },
              ]}
            />
            <div className="flex rounded-xl border border-white/15 bg-black/40 p-1" role="group" aria-label="Certificates view">
              <button
                type="button"
                onClick={() => setView("cards")}
                aria-pressed={view === "cards"}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all",
                  view === "cards" ? "bg-[#a78bfa] text-black" : "text-white/40 hover:text-white",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setView("journey")}
                aria-pressed={view === "journey"}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all",
                  view === "journey"
                    ? "bg-[#d4af37] text-black shadow-[0_0_18px_rgba(212,175,55,0.5)]"
                    : "text-white/40 hover:text-white",
                )}
              >
                <Route className="h-3.5 w-3.5" aria-hidden="true" />
                Journey
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {journeySpan && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 font-mono text-[10px] font-bold text-[#e9ce7a] uppercase">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {journeySpan}
              </span>
            )}
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
          onAddIn={(id) => onEdit(blankCert(id === "__none__" ? "" : id))}
          onBulk={(id, action) =>
            onBulk((x) => inGroup(x as unknown as AdminCert, id), action)
          }
          onRename={(id, label) => {
            if (id !== "__none__") onRenameValue(id, label);
          }}
          onAddCategory={(name) => onEdit(blankCert(name))}
        />
      }
    >
      {view === "journey" ? (
        <JourneyTimeline groups={journeyGroups} onEdit={onEdit} onToggle={onToggle} />
      ) : (
        sorted.map((c) => (
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
                <FreshChip year={c.year} />
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
                  {c.verifyLogo !== "" ? (
                    <span className="relative block h-4 w-4 shrink-0 overflow-hidden rounded bg-white">
                      <SmartImage src={c.verifyLogo} alt="" fill fit="contain" sizes="16px" />
                    </span>
                  ) : (
                    <BadgeCheck className="h-3.5 w-3.5" />
                  )}
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
      )))}
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
      const name = `budi-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([exportJSON(db)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("ok", "Backup exported", name);
    } catch {
      notify("err", "Export failed in this browser.");
    }
  };

  const doImport = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (): void => {
      const next = importJSON(String(reader.result ?? ""));
      if (!next) {
        notify("err", "Invalid backup file", "Import aborted, nothing changed.");
        return;
      }
      if (!window.confirm(`Restore backup? ${next.skills.length} skills · ${next.services.length} services · ${next.projects.length} projects · ${next.certs.length} certs.`)) return;
      saveDB(next);
      onImport(next);
      notify("ok", "Backup restored", "Dashboard now shows the imported data.");
    };
    reader.onerror = (): void => {
      notify("err", "Could not read that file.");
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

      {/* Settings quick-jump — long page, organized in one tap */}
      <nav aria-label="Settings sections" className="mt-4 flex flex-wrap gap-1.5">
        {[
          { id: "set-work", label: "Work" },
          { id: "set-identity", label: "Identity + Images" },
          { id: "set-rails", label: "Payments" },
          { id: "set-seals", label: "Seals" },
          { id: "set-data", label: "Backup" },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="cursor-pointer rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white/55 uppercase transition-colors hover:border-[#d7fd44]/50 hover:text-[#d7fd44]"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Availability command — THE one switch for every badge on the site */}
      <div id="set-work" className="relative mt-5 scroll-mt-24 overflow-hidden rounded-2xl border border-[#d7fd44]/25 bg-gradient-to-br from-[#d7fd44]/[0.06] via-transparent to-[#ff3d00]/[0.06] p-6">
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
      <DeployCard />
      <div id="set-identity" className="mt-5 grid scroll-mt-24 gap-4 lg:grid-cols-2">
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
      <div id="set-rails" className="mt-4 scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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
      <div id="set-seals" className="mt-4 scroll-mt-24 rounded-2xl border border-sky-400/20 bg-sky-400/[0.03] p-6">
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
      <div id="set-data" className="mt-4 scroll-mt-24 rounded-xl border border-white/10 bg-white/[0.03] p-5">
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
                notify("ok", "Likes cleared on this browser.");
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
                notify("ok", "Skill likes cleared on this browser.");
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
  labels,
}: {
  initial: AdminService | null;
  onClose: () => void;
  onSave: (item: AdminService, keepOpen?: boolean) => void;
  labels?: Record<string, string>;
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
              <span className={cn("font-mono text-[10px] font-black tracking-[0.12em] uppercase", active ? "text-white" : "text-white/50")}>{catDisplayLabel(labels, "service", c, CAT_LABEL[c])}</span>
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
      <div className="mb-4 flex flex-wrap gap-2">
        <TranslateEnFr
          accent={catAccent}
          pairs={[
            { en: form.title, fr: form.titleFr, apply: (v) => set("titleFr", v as string) },
            { en: form.desc, fr: form.descFr, apply: (v) => set("descFr", v as string) },
            { en: form.bestForEn, fr: form.bestForFr, apply: (v) => set("bestForFr", v as string) },
            { en: form.timelineEn, fr: form.timelineFr, apply: (v) => set("timelineFr", v as string) },
            { en: form.points, fr: form.pointsFr, apply: (v) => set("pointsFr", v as string[]) },
          ]}
        />
        <SuggestCopy
          category={form.category}
          isEmpty={form.title.trim() === "" && form.desc.trim() === ""}
          accent={catAccent}
          onApply={(s) =>
            setForm((f) => ({
              ...f,
              title: f.title.trim() === "" ? s.title : f.title,
              titleFr: f.titleFr.trim() === "" ? s.titleFr : f.titleFr,
              desc: f.desc.trim() === "" ? s.desc : f.desc,
              descFr: f.descFr.trim() === "" ? s.descFr : f.descFr,
              tags: f.tags.length === 0 ? [...s.tags] : f.tags,
              points: f.points.length === 0 ? [...s.points] : f.points,
              pointsFr: f.pointsFr.length === 0 ? [...s.pointsFr] : f.pointsFr,
              bestForEn: f.bestForEn.trim() === "" ? s.bestForEn : f.bestForEn,
              bestForFr: f.bestForFr.trim() === "" ? s.bestForFr : f.bestForFr,
              timelineEn: f.timelineEn.trim() === "" ? s.timelineEn : f.timelineEn,
              timelineFr: f.timelineFr.trim() === "" ? s.timelineFr : f.timelineFr,
            }))
          }
        />
      </div>
      <div className="mb-4">
        <Field
          label="Icon — tech brand mark or image link"
          hint={form.icon !== "" ? `legacy library: ${form.icon}` : form.iconImage !== "" ? "brand mark" : "category default"}
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
                  ? "Legacy library icon still wins — clear it to use the brand mark."
                  : form.iconImage !== ""
                    ? "Brand mark renders on the site card."
                    : "Empty = the category icon. Pick a brand mark or paste an image link."}
              </p>
              {(form.icon !== "" || form.iconImage !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Delete the service icon? The card falls back to the category icon.")) return;
                    set("icon", "");
                    set("iconImage", "");
                  }}
                  title="Delete icon"
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.08em] text-red-300 uppercase transition-all hover:bg-red-500/20"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  Delete icon
                </button>
              )}
            </div>
            <TechLogoPicker
              value={form.iconImage}
              accent={catAccent}
              onPick={(logo) => {
                set("iconImage", logo);
                if (logo !== "") set("icon", "");
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
  labels,
}: {
  initial: AdminSkill | null;
  onClose: () => void;
  onSave: (item: AdminSkill, keepOpen?: boolean) => void;
  labels?: Record<string, string>;
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
        <TranslateEnFr
          accent={levelColor}
          pairs={[
            { en: form.detailEn, fr: form.detailFr, apply: (v) => set("detailFr", v as string) },
          ]}
        />
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
                  <span className={cn("mt-1.5 block text-xs font-black", active ? "text-white" : "text-white/55")}>{catDisplayLabel(labels, "skill", c, meta.label)}</span>
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
              Tech logo — real brand mark
            </span>
            {form.logo !== "" && (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("Delete the skill logo? The card falls back to its letter mark.")) return;
                  set("logo", "");
                }}
                title="Delete logo"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.08em] text-red-300 uppercase transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Delete logo
              </button>
            )}
          </span>
          <TechLogoPicker value={form.logo} accent={catColor} onPick={(logo) => set("logo", logo)} />
          {form.icon !== "" && (
            <p className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[9px] tracking-[0.08em] text-amber-300/80 uppercase">
              <span>Legacy library icon “{form.icon}” still wins on the site card</span>
              <button
                type="button"
                onClick={() => set("icon", "")}
                className="shrink-0 cursor-pointer underline underline-offset-2 hover:text-red-300"
              >
                Drop it
              </button>
            </p>
          )}
        </div>
        <Field label="Custom logo link" hint="SVG path or https URL">
          <input
            value={form.logo}
            onChange={(e) => {
              set("logo", e.target.value);
            }}
            placeholder="/icons/tech/custom.svg or https://…"
            dir="ltr"
            className={inputCls}
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
  suggestions,
  categories,
}: {
  initial: AdminProject | null;
  onClose: () => void;
  onSave: (item: AdminProject, keepOpen?: boolean) => void;
  /** This account's skill names — offered first in the stack picker. */
  suggestions?: string[];
  /** Existing project categories — category field suggests, never forces. */
  categories?: string[];
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
        <Field label="Category — pick or type new">
          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="SaaS / Dashboard…"
            className={inputCls}
            maxLength={40}
            list="proj-cat-list"
          />
          <datalist id="proj-cat-list">
            {(categories ?? []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
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
        <div className="sm:col-span-2">
          <TranslateEnFr
            accent="#ff3d00"
            pairs={[
              { en: form.title, fr: form.titleFr, apply: (v) => set("titleFr", v as string) },
              { en: form.desc, fr: form.descFr, apply: (v) => set("descFr", v as string) },
              { en: form.roleEn, fr: form.roleFr, apply: (v) => set("roleFr", v as string) },
              { en: form.timelineEn, fr: form.timelineFr, apply: (v) => set("timelineFr", v as string) },
              { en: form.briefEn, fr: form.briefFr, apply: (v) => set("briefFr", v as string[]) },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <Field label="Tech stack — pick, don't type" hint={`${form.tech.length}/14`}>
            <TechPicker
              selected={form.tech}
              onChange={(t) => set("tech", t)}
              suggestions={suggestions}
              max={14}
              accent="#ff3d00"
            />
          </Field>
        </div>
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
  suggestions,
}: {
  initial: AdminCert | null;
  onClose: () => void;
  onSave: (item: AdminCert, keepOpen?: boolean) => void;
  /** This account's skill names — offered first in the skills picker. */
  suggestions?: string[];
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
      verifyLogo: "",
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
      verifyLogo: "",
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
        <div className="sm:col-span-2">
          <TranslateEnFr
            accent="#a78bfa"
            pairs={[
              { en: form.titleEn, fr: form.titleFr, apply: (v) => set("titleFr", v as string) },
              { en: form.issuerEn, fr: form.issuerFr, apply: (v) => set("issuerFr", v as string) },
            ]}
          />
        </div>
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
        <div className="sm:col-span-2">
          <Field label="Skills — pick, don't type" hint={`${form.skills.length}/10`}>
            <TechPicker
              selected={form.skills}
              onChange={(t) => set("skills", t)}
              suggestions={suggestions}
              max={10}
              accent="#a78bfa"
            />
          </Field>
        </div>
        <Field label="Verify URL (empty = soon)">
          <input value={form.verify} onChange={(e) => set("verify", e.target.value)} dir="ltr" className={inputCls} maxLength={200} />
        </Field>
        <ImageUploadField
          label="Verified logo — issuer mark"
          hint="shown beside the verify link"
          value={form.verifyLogo}
          onChange={(v) => set("verifyLogo", v)}
          pastePlaceholder="/images/certificates/issuers/… or https://…"
        />
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
