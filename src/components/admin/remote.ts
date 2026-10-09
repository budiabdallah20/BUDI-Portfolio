"use client";

/**
 * Dashboard → Supabase bridge. Reads are public (anon, via /api/content);
 * every write carries the admin secret verified server-side.
 * The secret lives in sessionStorage (this tab only, cleared on logout).
 */

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
): Promise<{ ok: true; revalidated?: boolean; at?: number }> {
  return post("/api/admin/save", { table, row });
}

export function remoteRemove(
  table: string,
  id: string,
): Promise<{ ok: true; revalidated?: boolean; at?: number }> {
  return post("/api/admin/remove", { table, id });
}

export function remoteSeed(
  db: unknown,
): Promise<{ ok: true; revalidated?: boolean; at?: number; seeded?: Record<string, number> }> {
  return post("/api/admin/seed", { db });
}

export interface RevalidateResult {
  ok: true;
  revalidated: boolean;
  at: number;
  paths?: string[];
}

/**
 * REAL hard refresh — purges the live site's ISR cache server-side.
 * Resolves with the rebuild timestamp so the UI can prove freshness.
 */
export function requestRevalidate(): Promise<RevalidateResult> {
  return post("/api/admin/revalidate", {});
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
