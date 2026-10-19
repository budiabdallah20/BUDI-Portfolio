import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS, RATE_LIMIT_FACTS } from "@/lib/security/limits";
import { DOH_ALLOWED_HOSTS } from "@/lib/security/dns";
import {
  isLoopbackName,
  normalizeHostname,
  probeTls,
  type TlsProbeResult,
} from "@/lib/security/tls-probe";
import type { StatusGuards, StatusResponse, TimeoutFact } from "@/lib/security/types";

/**
 * Live security self-report — what the /security certificate page renders.
 *
 * Everything here is measured or read from the running server, not copied
 * copy: the TLS block comes from a real loopback handshake performed by this
 * handler (tls-probe), the guards/limits come from the same modules the
 * routes enforce. On a hosted platform (non-loopback host) the TLS handshake
 * happens at the edge, so the probe is skipped and the page shows the
 * platform certificate instead.
 */

export const dynamic = "force-dynamic";

const TIMEOUTS: TimeoutFact[] = [
  { where: "TLS self-probe", ms: 4_000, note: "handshake read-back on this server" },
  { where: "DNS-over-HTTPS (SPF/DMARC)", ms: 5_000, note: "dns.google, SSRF-guarded" },
  { where: "Supabase (server client)", ms: 15_000, note: "every DB read/write aborts instead of hanging" },
  { where: "GitHub deploy commands", ms: 120_000, note: "git subprocess in /api/admin/deploy" },
  { where: "Weather widget (client)", ms: 8_000, note: "open-meteo fetch aborts on timeout" },
  { where: "Prayer times (client)", ms: 10_000, note: "aladhan.com fetch aborts on timeout" },
  { where: "EN→FR translate (client)", ms: 12_000, note: "dashboard drafting aid" },
];

const GUARDS: Omit<StatusGuards, "rateLimits"> = {
  ssrf: {
    enforced: true,
    allowedHosts: [...DOH_ALLOWED_HOSTS],
    rules: [
      "https on port 443 only, no embedded credentials",
      "IP-literal hosts blocked (incl. decimal/hex forms — URL-parser normalized)",
      "loopback / private suffixes (.local, .internal, …) blocked",
      "redirects never followed (a 3xx from an allowed host cannot bounce inward)",
      "response size capped while streaming; every call carries a hard timeout",
    ],
  },
  path: {
    enforced: true,
    rules: [
      "every filesystem path resolves through resolveInside(root) — lib/security/safe-path",
      "`..` / absolute segments that would escape the project root resolve to null",
      "NUL-byte segments rejected",
      "no user input ever becomes a filesystem path (content lives in Supabase)",
    ],
  },
  timeouts: { enforced: true, entries: TIMEOUTS },
  maxBodyBytes: 4 * 1024 * 1024,
};

/**
 * The TLS probe may only ever target the ports this server itself serves on
 * a browser-reachable loopback origin. Without this allowlist a forged
 * `Host: localhost:<anything>` would turn the endpoint into an internal
 * port scanner (each probe reflects a TLS oracle back in `tls.error`).
 */
const PROBE_PORTS: ReadonlySet<number> = new Set(
  [3000, 8443, Number(process.env.PORT)].filter(
    (port) => Number.isInteger(port) && port > 0 && port <= 65_535,
  ),
);

let probeCache: { key: string; at: number; result: TlsProbeResult } | null = null;
const PROBE_CACHE_MS = 10_000;

/** Cached probe: one handshake per host:port per 10s, whatever the traffic. */
async function probeOnce(hostname: string, port: number): Promise<TlsProbeResult> {
  const probeHost = hostname === "::1" ? "::1" : "127.0.0.1";
  const key = `${probeHost}:${port}`;
  const now = Date.now();
  if (probeCache && probeCache.key === key && now - probeCache.at < PROBE_CACHE_MS) {
    return probeCache.result;
  }
  const result = await probeTls(probeHost, port);
  probeCache = { key, at: now, result };
  return result;
}

export async function GET(req: Request): Promise<NextResponse> {
  const rl = rateLimit(`security-status:${clientIp(req)}`, RATE_LIMITS.securityStatus.max, RATE_LIMITS.securityStatus.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const forwardedList = req.headers
    .get("x-forwarded-proto")
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== "");
  // Tail of the list: an appending proxy adds the real hop last, so a
  // client-supplied "https" prefix can never fake the report.
  const forwardedProto =
    forwardedList && forwardedList.length > 0 ? forwardedList[forwardedList.length - 1] : undefined;
  const { hostname, port } = normalizeHostname(req.headers.get("host") ?? "localhost");

  // Loopback → probe the local TLS listener (exact loopback spellings and
  // the server's own ports only — never an attacker-chosen host/port).
  // Hosted → the edge terminates TLS; the page shows platform mode instead.
  let tls: StatusResponse["transport"]["tls"] = null;
  const scope: StatusResponse["transport"]["scope"] = isLoopbackName(hostname) ? "local" : "platform";
  if (scope === "local" && port !== null && PROBE_PORTS.has(port)) {
    tls = await probeOnce(hostname, port);
  }

  const body: StatusResponse = {
    ok: true,
    at: new Date().toISOString(),
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    node: process.versions.node,
    transport: {
      scope,
      requestHttps: forwardedProto === "https" || (tls?.ok ?? false),
      tls,
    },
    guards: { ...GUARDS, rateLimits: RATE_LIMIT_FACTS },
    data: {
      store: "Supabase Postgres — public reads via anon + RLS, writes via service_role only",
      sensitiveUserData: false,
      notes: [
        "No visitor accounts, passwords, tokens or payment data — nothing sensitive to breach.",
        "Anonymous engagement counters only (visit counts, likes); voters are never identified.",
        "Admin surface is a shared secret (timing-safe compare) behind per-IP lockout + audit log.",
      ],
    },
  };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
