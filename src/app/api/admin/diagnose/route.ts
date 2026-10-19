import { NextResponse } from "next/server";
import { existsSync, statSync } from "node:fs";
import { rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { resolveInside } from "@/lib/security/safe-path";

/**
 * Deploy diagnostics — answers "why does /admin reject my PIN?", which is the
 * single most common support question on a self-hosted portfolio.
 *
 * WHY THIS EXISTS: the login screen could not tell "wrong PIN" apart from
 * "this deployment has no PIN configured", so a misconfigured production
 * deploy looks exactly like a typo. The verification path is byte-for-byte
 * identical in dev and prod — the ONLY variable is the value of
 * ADMIN_API_SECRET in the host's environment. This endpoint reports that
 * value's presence and length (never the value, never a hash) so the owner
 * can compare production against .env without ever printing the secret.
 *
 * SECURITY: deliberately unauthenticated and deliberately boring. It reveals
 * only boolean presence + string length of env vars whose names are already
 * public in .env.example. The admin PIN length is a non-secret — the login UI
 * is four fixed digit boxes. It does NOT reveal, hash, prefix or compare any
 * secret, and it never echoes a value. Rate-limited to keep it from being a
 * free oracle, and it answers with `Cache-Control: no-store` so a stale
 * deployment can't report the previous build's config.
 */

export const dynamic = "force-dynamic";

/** Env vars worth a yes/no on a deploy — the ones that make a page fall back. */
const WATCHED = [
  "ADMIN_API_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "GIT_TOKEN",
  "GITHUB_TOKEN",
] as const;

/** Video asset the birthday page expects — reported, never auto-created. */
function videoStatus(): { present: boolean; bytes: number; expected: string } {
  const expected = "/videos/birthday.mp4";
  // resolveInside: every filesystem path passes the traversal guard
  // (lib/security/safe-path) even though this one is fully hardcoded.
  const file = resolveInside(process.cwd(), "public", "videos", "birthday.mp4");
  if (!file) return { present: false, bytes: 0, expected };
  try {
    if (!existsSync(file)) return { present: false, bytes: 0, expected };
    return { present: true, bytes: statSync(file).size, expected };
  } catch {
    return { present: false, bytes: 0, expected };
  }
}

export async function GET(): Promise<NextResponse> {
  // Global bucket (not per-IP): the route is a shared debugging tool and a
  // free oracle — one budget for everyone. Numbers live in limits.ts so the
  // /security certificate reports exactly what this file enforces.
  const rl = rateLimit("admin-diagnose", RATE_LIMITS.diagnose.max, RATE_LIMITS.diagnose.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down — retry in a minute" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const env: Record<string, { set: boolean; length: number }> = {};
  for (const name of WATCHED) {
    const raw = (process.env[name] ?? "").trim();
    // GIT_TOKEN often ships as a placeholder — report it, don't judge it.
    env[name] = { set: raw.length > 0, length: raw.length };
  }

  const secret = env.ADMIN_API_SECRET ?? { set: false, length: 0 };

  // The whole diagnosis in one line — the UI shows this verbatim.
  let verdict: string;
  if (!secret.set) {
    verdict = "ADMIN_API_SECRET is MISSING — /api/admin/verify returns 500 and every PIN is rejected. Add it in the host's environment and redeploy.";
  } else if (secret.length !== 4) {
    verdict = `ADMIN_API_SECRET is ${secret.length} chars, not 4 — a copy/paste may have included quotes or the value was saved as a number. The login box is 4 digits.`;
  } else {
    verdict = "ADMIN_API_SECRET looks correctly configured (4 chars). If the deployed PIN is rejected, the deployed value differs from the one in your local .env — make them identical, character for character.";
  }

  return NextResponse.json(
    {
      ok: true,
      verdict,
      adminSecret: secret,
      env,
      video: videoStatus(),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      // Distinguishes "the host never got the var" from "you edited it but
      // forgot to redeploy" — the single most common Vercel trap.
      deployedAt: process.env.VERCEL_GIT_COMMIT_SHA
        ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8)
        : null,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}