import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "../_guard";

/**
 * REAL hard refresh — purges the ISR cache for the live site (`/`) and the
 * content API (`/api/content`), so the very next paint is rebuilt from
 * Supabase instead of served stale. Called by the dashboard "Hard" preview
 * buttons and the Home tab "Refresh site now" command. Every cloud write
 * (save / remove / seed) already revalidates server-side too — this route
 * is the explicit, provable trigger with a timestamp the UI can show.
 */
const CORS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
} as const;

/**
 * Origins allowed to READ this endpoint cross-origin: the deployed site
 * itself, local dev servers AND the LAN/Wi-Fi host `next dev` advertises
 * (the dashboard is often opened from a phone or a second device while
 * purging prod). Anything else gets no ACAO header → the browser blocks it,
 * and the missing header used to show up as "blocked by CORS policy" noise
 * in the console of every LAN admin session.
 * (The secret is still mandatory regardless — this only shrinks who may
 * even attempt from a browser.)
 */
function allowedOrigin(origin: string): boolean {
  if (origin === "") return false;
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (host.endsWith(".localhost") || host.endsWith(".local")) return true;
    if (
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return true;
    }
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    if (site !== "") {
      try {
        if (u.origin === new URL(site).origin) return true;
      } catch {
        /* misconfigured env — fall through */
      }
    }
    // Same-origin fetches send no Origin; Vercel previews share the suffix.
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(u.origin)) return true;
    return false;
  } catch {
    return false;
  }
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = { ...CORS };
  if (allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export async function OPTIONS(req: Request): Promise<NextResponse> {
  // NOTE: no credentials, no caching of preflights with secrets.
  return new NextResponse(null, { headers: corsHeaders(req) });
}

export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  const headers = corsHeaders(req);
  if (!gate.ok) {
    if (gate.retryAfterSec) headers["Retry-After"] = String(gate.retryAfterSec);
    return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
  }

  const paths: string[] = [];
  try {
    revalidatePath("/");
    paths.push("/");
  } catch {
    /* static export — nothing to purge */
  }
  try {
    revalidatePath("/api/content");
    paths.push("/api/content");
  } catch {
    /* static export — nothing to purge */
  }
  return NextResponse.json({ ok: true, revalidated: true, at: Date.now(), paths }, { headers });
}
