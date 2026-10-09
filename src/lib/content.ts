import type {
  AdminCert,
  AdminProject,
  AdminService,
  AdminSettings,
  AdminSkill,
} from "@/components/admin/store";
import { supabaseAnon } from "./supabase/server";

export interface RemoteContent {
  services: AdminService[];
  skills: AdminSkill[];
  projects: AdminProject[];
  certs: AdminCert[];
  settings: AdminSettings | null;
  visitsTotal: number;
  likes: Record<string, number>;
}

/**
 * Server-side content fetch (anon key, RLS: visible rows only).
 * Returns null on ANY failure — every section falls back to its baked-in
 * content, so the site renders identically with or without a database.
 */
export async function fetchContent(): Promise<RemoteContent | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) return null;
    const sb = supabaseAnon();
    const [services, skills, projects, certs, settings, visits, likes] = await Promise.all([
      sb.from("services").select("*").order("title"),
      sb.from("skills").select("*"),
      sb.from("projects").select("*"),
      sb.from("certs").select("*"),
      sb.from("settings").select("*").eq("id", "site").maybeSingle(),
      sb.from("visits").select("count"),
      sb.from("likes").select("id,count"),
    ]);
    if (
      services.error ||
      skills.error ||
      projects.error ||
      certs.error ||
      settings.error ||
      visits.error ||
      likes.error
    ) {
      return null;
    }
    if (
      (services.data?.length ?? 0) === 0 &&
      (skills.data?.length ?? 0) === 0 &&
      (projects.data?.length ?? 0) === 0 &&
      (certs.data?.length ?? 0) === 0
    ) {
      return null;
    }
    const onlyLive = <T extends { visible?: boolean }>(rows: T[]): T[] =>
      rows.filter((r) => r.visible !== false);
    return {
      services: onlyLive((services.data ?? []) as AdminService[]),
      skills: onlyLive((skills.data ?? []) as AdminSkill[]),
      projects: onlyLive((projects.data ?? []) as AdminProject[]),
      certs: onlyLive((certs.data ?? []) as AdminCert[]),
      settings: (settings.data ?? null) as AdminSettings | null,
      visitsTotal: (visits.data ?? []).reduce((n, r) => n + (r.count ?? 0), 0),
      likes: Object.fromEntries((likes.data ?? []).map((r) => [r.id, r.count ?? 0])),
    };
  } catch {
    return null;
  }
}
