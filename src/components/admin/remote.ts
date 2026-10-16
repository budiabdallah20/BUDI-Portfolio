"use client";

/**
 * Dashboard → Supabase bridge. Reads are public (anon, via /api/content);
 * every write carries the admin secret verified server-side.
 * The secret lives in sessionStorage (this tab only, cleared on logout).
 */

import { siteConfig } from "@/config/site";

export const ADMIN_SECRET_KEY = "budi-admin-secret";

export function adminSecret(): string {
  try {
    return sessionStorage.getItem(ADMIN_SECRET_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeSecret(secret: string): void {
  try {
    sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
  } catch {
    /* ignore */
  }
}

export function clearSecret(): void {
  try {
    sessionStorage.removeItem(ADMIN_SECRET_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** FIFO chains per key — serializes rapid repeat writes so order is kept. */
const chains = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, job: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(job);
  chains.set(key, next.catch(() => undefined));
  void next.catch(() => undefined).finally(() => {
    if (chains.get(key) === next) chains.delete(key);
  });
  return next;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
    body: JSON.stringify(body),
  });
  let json: { error?: string } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new ApiError(json.error ?? `Request failed (${res.status})`, res.status);
  return json as T;
}

export function remoteSave(
  table: string,
  row: unknown,
): Promise<{ ok: true; revalidated?: boolean; prodRevalidated?: boolean; at?: number }> {
  const id =
    row && typeof row === "object" && "id" in row ? String((row as { id: unknown }).id) : "noid";
  // Per-row FIFO: hammering one item 10× in a second still lands IN ORDER —
  // the last write always wins, never a stale one overtaking it.
  return enqueue(`${table}:${id}`, () =>
    post<{ ok: true; revalidated?: boolean; at?: number }>("/api/admin/save", {
      table,
      row,
    }).then(async (res) => ({ ...res, prodRevalidated: await revalidateProd() })),
  );
}

export function remoteRemove(
  table: string,
  id: string,
): Promise<{ ok: true; revalidated?: boolean; prodRevalidated?: boolean; at?: number }> {
  return post<{ ok: true; revalidated?: boolean; at?: number }>("/api/admin/remove", {
    table,
    id,
  }).then(async (res) => ({ ...res, prodRevalidated: await revalidateProd() }));
}

export function remoteSeed(
  db: unknown,
): Promise<{ ok: true; revalidated?: boolean; prodRevalidated?: boolean; at?: number; seeded?: Record<string, number> }> {
  return post<{
    ok: true;
    revalidated?: boolean;
    at?: number;
    seeded?: Record<string, number>;
  }>("/api/admin/seed", { db }).then(async (res) => ({
    ...res,
    prodRevalidated: await revalidateProd(),
  }));
}

export interface RevalidateResult {
  ok: true;
  revalidated: boolean;
  prodRevalidated?: boolean;
  at: number;
  paths?: string[];
}

/** Main deployed domain — purged too, so localhost edits land live in seconds. */
const PROD_ORIGIN =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || siteConfig.url;

/**
 * Best-effort cross-origin purge: when the dashboard runs on localhost (or a
 * preview), the same-origin revalidate only clears THAT origin's ISR cache.
 * This also hits the main domain's /api/admin/revalidate with the same
 * secret, so the live site rebuilds within seconds. Same-origin → skipped
 * (already purged). Never throws — a missed prod purge just falls back to
 * the 60s ISR window.
 */
async function revalidateProd(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (window.location.origin === PROD_ORIGIN) return false;
    const res = await fetch(`${PROD_ORIGIN}/api/admin/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret() },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * REAL hard refresh — purges the live site's ISR cache server-side.
 * Resolves with the rebuild timestamp so the UI can prove freshness.
 */
export async function requestRevalidate(): Promise<RevalidateResult> {
  const local = await post<RevalidateResult>("/api/admin/revalidate", {});
  const prod = await revalidateProd();
  return { ...local, prodRevalidated: local.revalidated || prod };
}

export interface DeployStatus {
  ok: true;
  git: boolean;
  reason?: string;
  branch?: string;
  dirty?: number;
  files?: string[];
  lastCommit?: { hash: string; subject: string; at: string } | null;
  ahead?: number | null;
  behind?: number | null;
}

export interface DeployResult {
  ok: true;
  clean?: boolean;
  branch?: string;
  files?: number;
  hash?: string;
  at?: number;
  message?: string;
}

/** Repo status for the deploy card — filenames only, never contents. */
export async function deployStatus(): Promise<DeployStatus> {
  const res = await fetch("/api/admin/deploy", {
    headers: { "x-admin-secret": adminSecret() },
    cache: "no-store",
  });
  let errText = `Status failed (${res.status})`;
  let json: DeployStatus | null = null;
  try {
    const raw = (await res.json()) as { error?: unknown } & Partial<DeployStatus>;
    if (typeof raw.error === "string" && raw.error !== "") errText = raw.error;
    if (res.ok) json = raw as DeployStatus;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new ApiError(errText, res.status);
  if (!json) throw new ApiError("Status unreachable", 503);
  return json;
}

/** THE punch — commit + push every change to GitHub. Vercel deploys after. */
export function deployPunch(): Promise<DeployResult> {
  return post<DeployResult>("/api/admin/deploy", {});
}

export interface RemoteSnapshot {
  services: unknown[];
  skills: unknown[];
  projects: unknown[];
  certs: unknown[];
  settings: Record<string, unknown> | null;
  visitsTotal: number;
  likes: Record<string, number>;
}

export async function fetchSnapshot(): Promise<RemoteSnapshot> {
  const res = await fetch("/api/content", { cache: "no-store" });
  if (!res.ok) throw new Error("Content unreachable");
  return (await res.json()) as RemoteSnapshot;
}
