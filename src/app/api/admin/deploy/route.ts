import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { execFile } from "node:child_process";
import { checkAdmin } from "../_guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/security/limits";
import { audit, auditEventFromReq } from "@/lib/audit";

/**
 * "اضرب يا بودي" — one-tap GitHub sync from the dashboard.
 *
 * GET  → repo status (branch, dirty files, last commit). Read-only.
 * POST → add -A + auto-commit + push to origin + local ISR purge.
 *        Vercel (connected to the same repo) then builds + updates the
 *        production domain by itself — that part is automatic, not ours.
 *
 * Hardening (this endpoint runs shell-adjacent commands):
 * - execFile with a FIXED argv (no shell, no interpolation, no client text
 *   anywhere — the commit message is fully server-generated).
 * - Branch name allowlisted before use; every command has a 120s timeout.
 * - One deploy at a time (module lock) + tight rate limits (5/h per IP,
 *   10/h global) — a stuck double-click can't fork-bomb pushes.
 * - Push auth NEVER touches the client: plain `git push` uses the host's
 *   own credentials; if GIT_TOKEN/GITHUB_TOKEN exists in server env it is
 *   used for this push only and scrubbed from every byte we return or log.
 * - Every attempt is audit-logged (files count + commit hash, never diffs).
 */

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 120_000;
const BRANCH_RE = /^[A-Za-z0-9/_.-]{1,80}$/;
const MAX_FILES = 50;

let deploying = false;

interface GitResult {
  ok: boolean;
  out: string;
}

/**
 * A real GitHub token, or "". `.env` is normally copied from `.env.example`,
 * so the `ghp_xxxxxxxx…` placeholder MUST NOT be pushed to GitHub as if it
 * were real: that fails with a confusing 403 and the audit log blames the
 * repo. A placeholder is treated exactly like "not configured" — the host's
 * own git credentials then do the push.
 */
function realGitToken(value: string | undefined): string {
  const token = (value ?? "").trim();
  if (token === "") return "";
  if (/x{8,}/i.test(token)) return "";
  if (/^(your|my|replace|changeme|placeholder|paste|example)/i.test(token)) return "";
  return token;
}

function scrub(text: string): string {
  return (
    text
      // embedded credentials in remote URLs: https://user:pass@host → https://***@host
      .replace(/:\/\/[^/\s]*@/g, "://***@")
      // loose tokens, just in case they ever echo
      .replace(/gh[pousr]_[A-Za-z0-9_]+/g, "***")
      .replace(/github_pat_[A-Za-z0-9_]+/g, "***")
      .replace(/x-access-token/gi, "***")
      .slice(0, 1500)
  );
}

function runGit(args: string[], extraEnv?: Record<string, string>): Promise<GitResult> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd: process.cwd(), timeout: TIMEOUT_MS, env: { ...process.env, ...extraEnv } }, (err, stdout, stderr) => {
      const out = scrub(`${stdout ?? ""}${stderr ?? ""}`.trim());
      if (err) {
        const code = typeof (err as { code?: unknown }).code === "number" ? ` (exit ${(err as { code: number }).code})` : "";
        resolve({ ok: false, out: `${scrub(String((err as Error).message).split("\n")[0])}${code} :: ${out}`.slice(0, 1500) });
        return;
      }
      resolve({ ok: true, out });
    });
  });
}

function gateError(gate: { status: number; error: string; retryAfterSec?: number }): NextResponse {
  const headers = gate.retryAfterSec ? { "Retry-After": String(gate.retryAfterSec) } : undefined;
  return NextResponse.json({ error: gate.error }, { status: gate.status, headers });
}

function friendly(out: string): string {
  const low = out.toLowerCase();
  if (low.includes("not a git repository")) return "This server is not running from a git checkout.";
  if (low.includes("enoent") || low.includes("not recognized") || low.includes("not found"))
    return "git is not installed on this server.";
  if (low.includes("no upstream") || low.includes("has no upstream branch"))
    return "Branch has no upstream — set it once on the server: git push -u origin <branch>.";
  if (low.includes("authentication failed") || low.includes("could not read username") || low.includes("permission denied") || low.includes("403"))
    return "Push rejected: server has no GitHub credentials. Add a GIT_TOKEN env var (or sign git in on the server) and retry.";
  if (low.includes("rejected") && low.includes("fetch first"))
    return "Remote moved first — pull on the server, then punch again.";
  if (low.includes("etimedout") || low.includes("timed out") || low.includes("timeout"))
    return "git timed out — network hiccup, punch again.";
  return "git step failed — embarrassed, but honest. Detail below.";
}

/** Repo status — filenames only, never contents. */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  if (!gate.ok) return gateError(gate);
  const branchRes = await runGit(["branch", "--show-current"]);
  if (!branchRes.ok) {
    return NextResponse.json({ ok: true, git: false, reason: friendly(branchRes.out) });
  }
  const branch = branchRes.out.trim();
  if (!BRANCH_RE.test(branch)) {
    return NextResponse.json({ ok: true, git: true, branch: "unknown", dirty: 0, files: [], lastCommit: null });
  }
  const [statusRes, logRes, abRes] = await Promise.all([
    runGit(["status", "--porcelain"]),
    runGit(["log", "-1", "--format=%h|%s|%ci"]),
    runGit(["rev-list", "--left-right", "--count", "HEAD...@{u}"]),
  ]);
  const files = statusRes.ok
    ? statusRes.out.split("\n").map((l) => l.trim()).filter((l) => l !== "").slice(0, MAX_FILES)
    : [];
  const dirty = statusRes.ok
    ? statusRes.out.split("\n").filter((l) => l.trim() !== "").length
    : 0;
  let lastCommit: { hash: string; subject: string; at: string } | null = null;
  if (logRes.ok) {
    const [hash = "", subject = "", at = ""] = logRes.out.split("|");
    if (hash !== "") lastCommit = { hash, subject: subject.slice(0, 120), at };
  }
  let ahead: number | null = null;
  let behind: number | null = null;
  if (abRes.ok) {
    const [a = "", b = ""] = abRes.out.split(/\s+/);
    const na = Number(a);
    const nb = Number(b);
    if (Number.isInteger(na) && Number.isInteger(nb)) {
      ahead = na;
      behind = nb;
    }
  }
  return NextResponse.json({ ok: true, git: true, branch, dirty, files, lastCommit, ahead, behind });
}

/** The punch — add, auto-commit, push, purge local ISR. */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = checkAdmin(req);
  const ev = auditEventFromReq(req, "deploy");
  if (!gate.ok) {
    ev.ok = false;
    ev.error = gate.error;
    void audit(ev);
    return gateError(gate);
  }
  const ip = clientIp(req);
  const perIp = rateLimit(`deploy:${ip}`, RATE_LIMITS.deploy.max, RATE_LIMITS.deploy.windowMs);
  if (!perIp.ok) {
    return NextResponse.json(
      { error: "Too many punches — one deploy wave per while. Retry later.", retryAfterSec: perIp.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(perIp.retryAfterSec) } },
    );
  }
  const global = rateLimit(
    "deploy-global",
    RATE_LIMITS.deployGlobal.max,
    RATE_LIMITS.deployGlobal.windowMs,
  );
  if (!global.ok) {
    return NextResponse.json(
      { error: "Deploy lane busy — retry shortly.", retryAfterSec: global.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(global.retryAfterSec) } },
    );
  }
  if (deploying) {
    return NextResponse.json({ error: "A deploy is already running — wait for it to land." }, { status: 409 });
  }
  deploying = true;
  try {
    const fail = (msg: string, detail = ""): NextResponse => {
      ev.ok = false;
      ev.error = msg;
      void audit(ev);
      return NextResponse.json({ error: msg, detail: detail.slice(0, 500) }, { status: 500 });
    };

    const branchRes = await runGit(["branch", "--show-current"]);
    const branch = branchRes.ok ? branchRes.out.trim() : "";
    if (!branchRes.ok || !BRANCH_RE.test(branch)) return fail(friendly(branchRes.out), branchRes.out);

    const statusRes = await runGit(["status", "--porcelain"]);
    if (!statusRes.ok) return fail(friendly(statusRes.out), statusRes.out);
    const changed = statusRes.out.split("\n").filter((l) => l.trim() !== "");
    if (changed.length === 0) {
      ev.meta = { branch, result: "clean" };
      void audit(ev);
      return NextResponse.json({ ok: true, clean: true, branch, message: "Tree already clean — nothing to punch." });
    }

    const addRes = await runGit(["add", "-A"]);
    if (!addRes.ok) return fail(friendly(addRes.out), addRes.out);

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const commitRes = await runGit(["commit", "-m", `chore(dashboard): BUDI sync — ${changed.length} files (${stamp})`]);
    if (!commitRes.ok) {
      if (commitRes.out.toLowerCase().includes("nothing to commit")) {
        ev.meta = { branch, result: "clean" };
        void audit(ev);
        return NextResponse.json({ ok: true, clean: true, branch, message: "Tree already clean — nothing to punch." });
      }
      return fail(friendly(commitRes.out), commitRes.out);
    }
    const hash = await runGit(["rev-parse", "--short", "HEAD"]);
    const shortHash = hash.ok ? hash.out.trim().slice(0, 12) : "unknown";

    // Push auth: prefer a server-side token (never logged, never stored in
    // the repo), else the host's own git credentials do the job.
    const token = realGitToken(process.env.GIT_TOKEN ?? process.env.GITHUB_TOKEN);
    let pushRes: GitResult;
    if (token !== "") {
      const remoteRes = await runGit(["remote", "get-url", "origin"]);
      const m = /github\.com[/:]([^/\s]+\/[^/\s]+?)(\.git)?\s*$/.exec(remoteRes.ok ? remoteRes.out : "");
      if (!m) return fail("Cannot read a GitHub origin remote from this server.", "");
      const authed = `https://x-access-token:${token}@github.com/${m[1]}.git`;
      pushRes = await new Promise<GitResult>((resolve) => {
        execFile(
          "git",
          ["push", authed, `${branch}:${branch}`],
          { cwd: process.cwd(), timeout: TIMEOUT_MS },
          (err, stdout, stderr) => {
            const out = scrub(`${stdout ?? ""}${stderr ?? ""}`.trim());
            if (err) {
              resolve({ ok: false, out: `push failed :: ${out}`.slice(0, 1500) });
              return;
            }
            resolve({ ok: true, out });
          },
        );
      });
    } else {
      pushRes = await runGit(["push", "origin", branch]);
    }
    if (!pushRes.ok) return fail(friendly(pushRes.out), pushRes.out);

    try {
      revalidatePath("/");
    } catch {
      /* static route — ignore */
    }
    ev.meta = { branch, files: changed.length, hash: shortHash };
    void audit(ev);
    return NextResponse.json({
      ok: true,
      branch,
      files: changed.length,
      hash: shortHash,
      at: Date.now(),
      message: `Punched ${changed.length} file(s) to GitHub (${shortHash}). Vercel rebuilds the domain by itself — watch it go live.`,
    });
  } finally {
    deploying = false;
  }
}
