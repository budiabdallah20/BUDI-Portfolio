/**
 * Server-side row validation for /api/admin/* — the REAL gate.
 *
 * Client-side zod (store.ts) is UX sugar: an attacker with the secret (or
 * a stale dashboard tab) bypasses it trivially. Everything persisted to
 * Supabase must survive THIS file: allowlisted columns, typed fields,
 * length caps, URL whitelists (kills `javascript:` stored-XSS), and
 * payload-size ceilings (kills DB-bloat DoS).
 */

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9\-_:.]{0,119}$/;
const EMAIL_RE = /^[^\s@]{1,80}@[^\s@]{1,80}\.[^\s@]{2,24}$/;
const SCHEME_BLOCK_RE = /^(javascript|data|vbscript|file|blob):/i;

function isStr(v: unknown, max: number, allowEmpty = true): v is string {
  return (
    typeof v === "string" && v.length <= max && (allowEmpty || v.length > 0)
  );
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isStrArr(v: unknown, maxItems: number, maxLen: number): v is string[] {
  return (
    Array.isArray(v) &&
    v.length <= maxItems &&
    v.every((x) => typeof x === "string" && x.length >= 1 && x.length <= maxLen)
  );
}

/**
 * Public link whitelist — dashboard-owned URLs rendered as <a href>.
 * https:// + same-origin /… only. Anything else (javascript:, data:,
 * //evil-host, whitespace/control chars) is rejected → stored-XSS dead.
 */
export function isSafeLink(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const u = url.trim();
  if (u === "" || u.length > 500) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\s<>"'`\\]/.test(u) || /[\u0000-\u001f\u007f]/.test(u)) return false;
  if (SCHEME_BLOCK_RE.test(u)) return false;
  if (u.startsWith("/")) return !u.startsWith("//");
  if (/^https?:\/\//i.test(u)) {
    try {
      const p = new URL(u);
      return p.protocol === "https:" || p.protocol === "http:";
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Image-source whitelist — https, same-origin /, or image data-URLs.
 * data: is safe HERE because every render site uses a static <img>
 * context (scripts never execute inside <img>), but SVG payloads are
 * still scanned for <script / event-handlers in case the URL is ever
 * opened directly, and everything is size-capped.
 */
export function isSafeImage(src: unknown): src is string {
  if (typeof src !== "string") return false;
  if (src === "") return true;
  if (src.length > 1400000) return false;
  if (isSafeLink(src)) return true;
  if (!src.startsWith("data:image/")) return false;
  const head = src.slice(0, 120).toLowerCase();
  if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml)/.test(head)) return false;
  if (/<script/i.test(src) || /on\w+\s*=/i.test(src)) return false;
  return true;
}

export function isSafeEmail(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (v === "") return true;
  return v.length <= 120 && EMAIL_RE.test(v.trim());
}

type Field =
  | { k: "str"; max: number; empty?: boolean }
  | { k: "link" }
  | { k: "image" }
  | { k: "email" }
  | { k: "bool" }
  | { k: "enum"; values: readonly string[] }
  | { k: "int"; min: number; max: number }
  | { k: "strArr"; maxItems: number; maxLen: number };

function checkField(value: unknown, f: Field): boolean {
  switch (f.k) {
    case "str":
      return isStr(value, f.max, f.empty !== false);
    case "link":
      return value === "" || isSafeLink(value);
    case "image":
      return isSafeImage(value);
    case "email":
      return isSafeEmail(value);
    case "bool":
      return isBool(value);
    case "enum":
      return typeof value === "string" && (f.values as readonly string[]).includes(value);
    case "int":
      return (
        typeof value === "number" && Number.isInteger(value) && value >= f.min && value <= f.max
      );
    case "strArr":
      return (
        (value === undefined && true) ||
        (Array.isArray(value) &&
          value.length <= f.maxItems &&
          value.every((x) => typeof x === "string" && x.length <= f.maxLen))
      );
  }
}

const S = (max: number): Field => ({ k: "str", max });
const OPT_ARR = (maxItems: number, maxLen: number): Field => ({
  k: "strArr",
  maxItems,
  maxLen,
});

/** Column allowlist + per-field rules per table. Unknown keys are dropped. */
const TABLES: Record<string, Record<string, Field>> = {
  services: {
    title: { k: "str", max: 80, empty: false },
    titleFr: S(80),
    desc: S(400),
    descFr: S(400),
    tags: OPT_ARR(12, 30),
    points: OPT_ARR(10, 160),
    pointsFr: OPT_ARR(10, 160),
    category: { k: "enum", values: ["development", "design", "backend", "growth"] },
    icon: S(40),
    iconImage: { k: "image" },
    bestForEn: S(80),
    bestForFr: S(80),
    timelineEn: S(80),
    timelineFr: S(80),
    visible: { k: "bool" },
  },
  skills: {
    name: { k: "str", max: 40, empty: false },
    cat: { k: "enum", values: ["frontend", "backend", "tools"] },
    level: { k: "int", min: 10, max: 100 },
    proof: { k: "enum", values: ["daily", "portfolio", "client", "learning"] },
    logo: { k: "image" },
    icon: S(40),
    detailEn: S(220),
    detailFr: S(220),
    visible: { k: "bool" },
  },
  projects: {
    title: { k: "str", max: 80, empty: false },
    titleFr: S(80),
    desc: S(400),
    descFr: S(400),
    tech: OPT_ARR(14, 30),
    status: { k: "enum", values: ["completed", "in-progress"] },
    opensource: { k: "bool" },
    category: S(40),
    github: { k: "link" },
    period: S(40),
    year: S(9),
    demo: { k: "link" },
    image: { k: "image" },
    roleEn: S(120),
    roleFr: S(120),
    timelineEn: S(80),
    timelineFr: S(80),
    briefEn: OPT_ARR(8, 220),
    briefFr: OPT_ARR(8, 220),
    sponsored: { k: "bool" },
    visible: { k: "bool" },
  },
  certs: {
    titleEn: { k: "str", max: 90, empty: false },
    titleFr: S(90),
    issuerEn: S(60),
    issuerFr: S(60),
    year: S(9),
    months: { k: "int", min: 1, max: 60 },
    code: S(40),
    skills: OPT_ARR(10, 30),
    image: { k: "image" },
    verify: { k: "link" },
    verifyLogo: { k: "image" },
    visible: { k: "bool" },
    expiry: S(20),
    level: { k: "enum", values: ["beginner", "intermediate", "advanced", "expert"] },
    hours: { k: "int", min: 0, max: 10000 },
    type: { k: "enum", values: ["certificate", "badge", "award", "course"] },
    featured: { k: "bool" },
    pdf: { k: "str", max: 1500000 },
    issueDate: S(20),
    linkedSkills: OPT_ARR(12, 40),
  },
};

export const SAVE_TABLES = ["services", "skills", "projects", "certs", "settings"] as const;

const SETTINGS_FIELDS: Record<string, Field> = {
  siteName: S(60),
  tagline: S(160),
  maintenance: { k: "bool" },
  showLoader: { k: "bool" },
  likesEnabled: { k: "bool" },
  contactEmail: { k: "email" },
  heroImage: { k: "image" },
  aboutImage: { k: "image" },
  workStatus: { k: "enum", values: ["available", "unavailable"] },
  workNote: S(120),
  workNoteFr: S(120),
  workUntil: S(10),
  vodafoneState: { k: "enum", values: ["active", "soon", "off"] },
  vodafoneNumber: S(30),
  vodafoneAt: S(10),
  taptapState: { k: "enum", values: ["active", "soon", "off"] },
  taptapAt: S(10),
  instapayState: { k: "enum", values: ["active", "soon", "off"] },
  instapayHandle: S(60),
  instapayAt: S(10),
  siteVerified: { k: "bool" },
};

export interface SanitizeResult {
  ok: boolean;
  clean?: Record<string, unknown>;
  error?: string;
}

/**
 * Validate + strip one row. `id` is mandatory (1–120, slug charset).
 * Badges (jsonb, nested) are validated structurally, capped at 12.
 */
export function sanitizeRow(table: string, row: unknown): SanitizeResult {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return { ok: false, error: "Bad row" };
  }
  const input = row as Record<string, unknown>;
  if (typeof input.id !== "string" || !ID_RE.test(input.id)) {
    return { ok: false, error: "Row needs a valid id" };
  }
  const clean: Record<string, unknown> = { id: input.id };

  if (table === "settings") {
    for (const [key, rule] of Object.entries(SETTINGS_FIELDS)) {
      const v = input[key];
      if (v === undefined) continue;
      if (!checkField(v, rule)) return { ok: false, error: `Bad settings field: ${key}` };
      clean[key] = v;
    }
    const catLabels = input.catLabels;
    if (catLabels !== undefined) {
      if (!catLabels || typeof catLabels !== "object" || Array.isArray(catLabels)) {
        return { ok: false, error: "Bad catLabels" };
      }
      const entries = Object.entries(catLabels as Record<string, unknown>);
      if (entries.length > 60) return { ok: false, error: "Bad catLabels" };
      const out: Record<string, string> = {};
      for (const [k, v] of entries) {
        if (typeof k !== "string" || k.length > 80 || typeof v !== "string" || v.length > 60) {
          return { ok: false, error: "Bad catLabels" };
        }
        out[k] = v;
      }
      clean.catLabels = out;
    }
    const badges = input.verificationBadges;
    if (badges !== undefined) {
      if (!Array.isArray(badges) || badges.length > 12) {
        return { ok: false, error: "Bad verificationBadges" };
      }
      const out: { id: string; labelEn: string; labelFr: string; logo: string }[] = [];
      for (const b of badges) {
        if (!b || typeof b !== "object") return { ok: false, error: "Bad badge" };
        const r = b as Record<string, unknown>;
        if (
          !isStr(r.id, 60, false) ||
          !isStr(r.labelEn, 60) ||
          !isStr(r.labelFr, 60) ||
          !isSafeImage(r.logo)
        ) {
          return { ok: false, error: "Bad badge" };
        }
        out.push({ id: r.id, labelEn: r.labelEn, labelFr: r.labelFr, logo: r.logo });
      }
      clean.verificationBadges = out;
    }
    return { ok: true, clean };
  }

  const spec = TABLES[table];
  if (!spec) return { ok: false, error: "Unknown table" };
  for (const [key, rule] of Object.entries(spec)) {
    const v = input[key];
    if (v === undefined) continue;
    if (!checkField(v, rule)) return { ok: false, error: `Bad field: ${key}` };
    clean[key] = v;
  }
  return { ok: true, clean };
}

/** Rough JSON byte ceiling — rejects DB-bloat payloads before parsing cost. */
export function bodyTooLarge(contentLength: string | null, capBytes: number): boolean {
  if (!contentLength) return false;
  const n = Number(contentLength);
  return Number.isFinite(n) && n > capBytes;
}
