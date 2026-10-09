"use client";

/**
 * BUDI OS — workspace registry (the "100 dashboards, one app" system).
 *
 * One workspace = one dashboard account (BUDI Portfolio, Kayan, Massar…).
 * The registry is intentionally LIGHTWEIGHT — meta + login record only:
 * id, name, logo, theme, PIN gate, optional external dashboard URL.
 * Project data is NEVER stored here: builtin workspaces keep their own
 * isolated local DB (`budi-admin-db__<id>`) + their own Supabase project,
 * external workspaces live wherever their dashboard URL points.
 *
 * Session model:
 * - localStorage `budi-os-workspaces` → the registry (survives restart)
 * - localStorage `budi-os-last` → last opened workspace (resume on return)
 * - sessionStorage `budi-os-auth__<id>` → unlocked this tab (per-workspace)
 * - sessionStorage admin secret stays per-tab via remote.ts
 */

export interface Workspace {
  id: string;
  name: string;
  tagline: string;
  /** Logo image (path / URL / data URL). Empty = BUDI mark. */
  logo: string;
  /** Accent color for this workspace's loader + hub card. */
  theme: string;
  /** Local PIN gate for this workspace — exactly 4 digits (matches the
   *  PIN pad). Server PIN still guards cloud writes for the builtin
   *  workspace via /api/admin/verify. */
  pin: string;
  /** "builtin" = this app's full dashboard · "external" = linked URL. */
  kind: "builtin" | "external";
  /** External dashboard URL (external workspaces only). */
  dashboardUrl: string;
  createdAt: number;
  /** Login record — updated on every successful unlock. */
  lastOpenedAt: number;
  openCount: number;
}

const REGISTRY_KEY = "budi-os-workspaces";
const LAST_KEY = "budi-os-last";
const AUTH_PREFIX = "budi-os-auth__";

const DEFAULT_THEME = "#ff3d00";

function slugId(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gu, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return s || `ws-${Date.now().toString(36)}`;
}

export function builtinWorkspace(): Workspace {
  return {
    id: "budi-portfolio",
    name: "BUDI Portfolio",
    tagline: "Full-stack portfolio console",
    logo: "",
    theme: DEFAULT_THEME,
    pin: "2909",
    kind: "builtin",
    dashboardUrl: "",
    createdAt: 0,
    lastOpenedAt: 0,
    openCount: 0,
  };
}

function normalize(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id.trim() === "") return null;
  if (typeof r.name !== "string" || r.name.trim() === "") return null;
  const str = (v: unknown, fb: string, max: number): string =>
    typeof v === "string" ? v.slice(0, max) : fb;
  const num = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
  const theme =
    typeof r.theme === "string" && /^#[0-9a-fA-F]{6}$/.test(r.theme) ? r.theme : DEFAULT_THEME;
  return {
    id: r.id.slice(0, 60),
    name: r.name.slice(0, 60),
    tagline: str(r.tagline, "", 120),
    logo: str(r.logo, "", 1500000),
    theme,
    pin: typeof r.pin === "string" && /^\d{4}$/.test(r.pin) ? r.pin : "2909",
    kind: r.kind === "external" ? "external" : "builtin",
    dashboardUrl: str(r.dashboardUrl, "", 500),
    createdAt: num(r.createdAt),
    lastOpenedAt: num(r.lastOpenedAt),
    openCount: num(r.openCount),
  };
}

/** Full registry — builtin BUDI Portfolio always first, then by recency. */
export function loadWorkspaces(): Workspace[] {
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed)
      ? parsed.map(normalize).filter((w): w is Workspace => w !== null)
      : [];
    const builtin = builtinWorkspace();
    const storedBuiltin = list.find((w) => w.id === builtin.id);
    const rest = list.filter((w) => w.id !== builtin.id).slice(0, 100);
    rest.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt || b.createdAt - a.createdAt);
    return [storedBuiltin ?? builtin, ...rest];
  } catch {
    return [builtinWorkspace()];
  }
}

function persist(list: Workspace[]): void {
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(list.slice(0, 101)));
  } catch {
    /* storage blocked — hub still works in-memory this session */
  }
}

export function saveWorkspace(ws: Workspace): Workspace[] {
  const clean = normalize(ws) ?? builtinWorkspace();
  const merged = [clean, ...loadWorkspaces().filter((w) => w.id !== clean.id)];
  const builtin = merged.find((w) => w.id === builtinWorkspace().id);
  const rest = merged.filter((w) => w.id !== builtinWorkspace().id);
  rest.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt || b.createdAt - a.createdAt);
  const next = [...(builtin ? [builtin] : []), ...rest].slice(0, 101);
  persist(next);
  return next;
}

export function removeWorkspace(id: string): Workspace[] {
  if (id === builtinWorkspace().id) return loadWorkspaces();
  const next = loadWorkspaces().filter((w) => w.id !== id);
  persist(next);
  try {
    window.localStorage.removeItem(`budi-admin-db__${id}`);
    window.sessionStorage.removeItem(`${AUTH_PREFIX}${id}`);
  } catch {
    /* ignore */
  }
  return next;
}

export function createWorkspace(input: {
  name: string;
  tagline?: string;
  logo?: string;
  theme?: string;
  pin?: string;
  kind?: "builtin" | "external";
  dashboardUrl?: string;
}): Workspace {
  const now = Date.now();
  const ws: Workspace = {
    id: `${slugId(input.name)}-${now.toString(36)}`,
    name: input.name.trim().slice(0, 60),
    tagline: (input.tagline ?? "").trim().slice(0, 120),
    logo: (input.logo ?? "").slice(0, 1500000),
    theme:
      input.theme && /^#[0-9a-fA-F]{6}$/.test(input.theme) ? input.theme : DEFAULT_THEME,
    pin: input.pin && /^\d{4}$/.test(input.pin) ? input.pin : "2909",
    kind: input.kind === "external" ? "external" : "builtin",
    dashboardUrl: (input.dashboardUrl ?? "").trim().slice(0, 500),
    createdAt: now,
    lastOpenedAt: 0,
    openCount: 0,
  };
  saveWorkspace(ws);
  return ws;
}

/** Record a successful unlock — the "سجل امتى دخل" login ledger. */
export function recordOpen(id: string): Workspace[] {
  const list = loadWorkspaces().map((w) =>
    w.id === id ? { ...w, lastOpenedAt: Date.now(), openCount: w.openCount + 1 } : w,
  );
  persist(list);
  try {
    window.localStorage.setItem(LAST_KEY, id);
  } catch {
    /* ignore */
  }
  return list;
}

export function lastWorkspaceId(): string | null {
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

export function clearLastWorkspace(): void {
  try {
    window.localStorage.removeItem(LAST_KEY);
  } catch {
    /* ignore */
  }
}

function authKey(id: string): string {
  return `${AUTH_PREFIX}${id}`;
}

export function isWorkspaceAuthed(id: string): boolean {
  try {
    // Legacy single-dashboard session counts for the builtin workspace.
    if (id === builtinWorkspace().id && window.sessionStorage.getItem("budi-admin") === "1")
      return true;
    return window.sessionStorage.getItem(authKey(id)) === "1";
  } catch {
    return false;
  }
}

export function markWorkspaceAuthed(id: string): void {
  try {
    window.sessionStorage.setItem(authKey(id), "1");
    if (id === builtinWorkspace().id) window.sessionStorage.setItem("budi-admin", "1");
  } catch {
    /* session-only fallback */
  }
}

export function logoutWorkspace(id: string): void {
  try {
    window.sessionStorage.removeItem(authKey(id));
    if (id === builtinWorkspace().id) {
      window.sessionStorage.removeItem("budi-admin");
      window.sessionStorage.removeItem("budi-admin-secret");
    } else {
      window.sessionStorage.removeItem(`budi-admin-secret__${id}`);
    }
  } catch {
    /* ignore */
  }
}

/** First-open welcome flag — one designed greeting per account, ever. */
function welcomedKey(id: string): string {
  return `budi-os-welcomed__${id}`;
}

export function hasSeenWelcome(id: string): boolean {
  try {
    return window.localStorage.getItem(welcomedKey(id)) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeSeen(id: string): void {
  try {
    window.localStorage.setItem(welcomedKey(id), "1");
  } catch {
    /* ignore */
  }
}
