/**
 * Data-source contract — the seam where Supabase plugs in.
 *
 * TODAY: `"local"` — everything flows through `components/admin/store.ts`
 * (localStorage, zero backend). The dashboard ONLY talks to the store, so
 * the UI will not change one line when the backend lands.
 *
 * NEXT (Supabase binding mission):
 *  1. `npm i @supabase/supabase-js` + `.env`: NEXT_PUBLIC_SUPABASE_URL,
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY (server key stays in server routes only).
 *  2. Create tables with the exact shapes below (column names = field
 *     names; `id text primary key`, `visible boolean default true`).
 *  3. RLS: public SELECT on visible rows for the site; authenticated
 *     full access for the dashboard (service role via Route Handlers only).
 *  4. Implement `SupabaseSource` against this interface, flip
 *     `getDataSource()` to return it, done — visits + likes become
 *     `increment` RPCs + realtime subscriptions instead of localStorage.
 */

import type {
  AdminCert,
  AdminProject,
  AdminService,
  AdminSkill,
} from "@/components/admin/store";

export type DataSourceKind = "local" | "supabase";

export function getDataSource(): DataSourceKind {
  return "local";
}

/** Supabase table names — one per dashboard section, plus counters. */
export type TableName =
  | "services"
  | "skills"
  | "projects"
  | "certs"
  | "settings"
  | "visits"
  | "likes";

/** Row shapes — mirror the Admin* interfaces 1:1 (snake_case only if the
 *  project convention demands it; otherwise keep camelCase columns). */
export interface SupabaseRows {
  services: AdminService;
  skills: AdminSkill;
  projects: AdminProject;
  certs: AdminCert;
  settings: { id: "site"; siteName: string; tagline: string; maintenance: boolean; showLoader: boolean; likesEnabled: boolean; contactEmail: string; heroImage: string; aboutImage: string; workStatus: string; workNote: string; workNoteFr: string; workUntil: string; vodafoneState: string; vodafoneNumber: string; vodafoneAt: string; taptapState: string; taptapAt: string; instapayState: string; instapayHandle: string; instapayAt: string; siteVerified: boolean; verificationBadges: { id: string; labelEn: string; labelFr: string; logo: string }[] };
  /** One row per day: { id: "2026-10-08", count: n } — replaces visitsBase. */
  visits: { id: string; count: number };
  /** One row per project key: { id: "<github|title>", count: n } — replaces budi-likes. */
  likes: { id: string; count: number };
}

/** Minimal SQL sketch (run in the Supabase SQL editor):
 *
 *  create table services (id text primary key, title text not null,
 *    "desc" text default '', tags text[] default '{}', points text[] default '{}',
 *    category text default 'development', "bestForEn" text default '',
 *    "bestForFr" text default '', "timelineEn" text default '',
 *    "timelineFr" text default '', visible boolean default true,
 *    updated_at timestamptz default now());
 *  -- repeat for skills / projects / certs with their fields;
 *  create table visits (id text primary key, count int default 0);
 *  create table likes (id text primary key, count int default 0);
 *  alter table services enable row level security;
 *  create policy "public read visible" on services for select using (visible = true);
 */
