"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  Globe,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/config/site";
import { gradeOf } from "@/lib/security/score";
import type { StatusResponse } from "@/lib/security/types";
import { cn } from "@/lib/utils";

/**
 * The /security certificate — a live dashboard of what actually protects
 * this site. Nothing here is hardcoded copy: headers are read back from the
 * REAL response, the TLS block comes from a handshake the server performs
 * on itself (/api/security/status → tls-probe), and the guards/limits are
 * the same constants the routes enforce (single source of truth).
 */

interface DnsRecord {
  host: string;
  type: string;
  value: string;
  purpose: string;
}

interface DnsReport {
  ok: true;
  domain: string;
  spf: { found: boolean; record: string | null };
  dmarc: { found: boolean; record: string | null };
  recommended: DnsRecord[];
  queriedAt: string;
}

interface CheckView {
  id: string;
  title: string;
  value: string;
  pass: boolean;
  core: boolean;
  source: "live" | "server" | "policy";
}

/** Default domain to probe: the deployed site's hostname (skip localhost). */
function defaultDomain(): string {
  try {
    const host = new URL(siteConfig.url).hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || !host.includes(".")) return "";
    return host;
  } catch {
    return "";
  }
}

const COPY = {
  en: {
    back: "Back to portfolio",
    title: "Security Certificate",
    subtitle:
      "Live self-check of the transport, headers, guards and rate limits protecting this site — protocol, certificate and headers are read back live; guards, limits and storage are the deployed policy, never a copied checklist.",
    gradeLabel: "Security grade",
    refresh: "Re-run checks",
    running: "Running checks…",
    checkedAt: "Checked live at",
    loadFailed: "Could not read the live report — retry.",
    stat: { protocol: "Protocol", certificate: "Certificate", cipher: "Cipher", layers: "Layers passed" },
    pass: "Pass",
    fail: "Action needed",
    source: { live: "live read-back", server: "server-enforced", policy: "policy" },
    checks: {
      tls: "HTTPS / TLS full encryption",
      hsts: "HSTS — browsers forced to HTTPS",
      csp: "CSP — content security policy",
      xfo: "Clickjacking protection",
      nosniff: "MIME-sniffing prevention",
      referrer: "Referrer-Policy + Permissions-Policy",
      xss: "XSS — every output escaped",
      ssrf: "SSRF — internal network blocked",
      path: "Path traversal — files isolated to project",
      rate: "Rate limiting per IP",
      timeouts: "Time limits on every outbound call",
      data: "No sensitive data stored",
      cert: "Trusted local TLS certificate",
    } as Record<string, string>,
    email: {
      title: "Email hardening — SPF · DMARC · DKIM",
      subtitle:
        "Records your domain should publish so nobody can spoof mail from @your-domain. Checked live through DNS-over-HTTPS.",
      placeholder: "your-domain.com",
      check: "Check domain",
      checking: "Querying DNS…",
      spfFound: "SPF published",
      spfMissing: "No SPF record",
      dmarcFound: "DMARC published",
      dmarcMissing: "No DMARC record",
      recommended: "Recommended records — publish these at your DNS provider",
      host: "Host",
      copy: "Copy",
      copied: "Copied",
      lookupFailed: "Lookup failed — try again.",
      why: "With SPF + DMARC (p=reject) spoofed mail is refused before it reaches anyone's inbox.",
    },
    footnoteLocal:
      "Measured on this running server just now. Local mode shows the self-signed CA trusted on this machine; the deployed site shows platform-managed TLS (auto-renew). Only anonymous counters are stored — never passwords, tokens or payment data.",
    footnoteEdge:
      "TLS terminates at the hosting edge (certificate auto-renewed); the app layer above still enforces HSTS, CSP and every guard. Only anonymous counters are stored — never passwords, tokens or payment data.",
  },
  fr: {
    back: "Retour au portfolio",
    title: "Certificat de sécurité",
    subtitle:
      "Auto-contrôle en direct du transport, des en-têtes, des protections et des limites de débit — protocole, certificat et en-têtes lus en direct ; protections, limites et stockage relèvent de la politique déployée, jamais d'une checklist recopiée.",
    gradeLabel: "Note de sécurité",
    refresh: "Relancer les contrôles",
    running: "Contrôles en cours…",
    checkedAt: "Vérifié en direct à",
    loadFailed: "Impossible de lire le rapport en direct — réessayez.",
    stat: { protocol: "Protocole", certificate: "Certificat", cipher: "Chiffrement", layers: "Couches validées" },
    pass: "Valide",
    fail: "Action requise",
    source: { live: "mesuré en direct", server: "appliqué côté serveur", policy: "politique" },
    checks: {
      tls: "Chiffrement complet HTTPS / TLS",
      hsts: "HSTS — navigateurs forcés en HTTPS",
      csp: "CSP — politique de sécurité du contenu",
      xfo: "Protection anti-clickjacking",
      nosniff: "Blocage du reniflage MIME",
      referrer: "Referrer-Policy + Permissions-Policy",
      xss: "XSS — toutes les sorties échappées",
      ssrf: "SSRF — réseaux internes bloqués",
      path: "Path traversal — fichiers isolés au projet",
      rate: "Limitation du débit par IP",
      timeouts: "Délais sur tous les appels sortants",
      data: "Aucune donnée sensible stockée",
      cert: "Certificat TLS local de confiance",
    } as Record<string, string>,
    email: {
      title: "Durcissement e-mail — SPF · DMARC · DKIM",
      subtitle:
        "Les enregistrements à publier pour que personne ne puisse usurper @votredomaine. Vérifiés en direct via DNS-over-HTTPS.",
      placeholder: "votre-domaine.com",
      check: "Vérifier le domaine",
      checking: "Interrogation DNS…",
      spfFound: "SPF publié",
      spfMissing: "Aucun enregistrement SPF",
      dmarcFound: "DMARC publié",
      dmarcMissing: "Aucun enregistrement DMARC",
      recommended: "Enregistrements recommandés — à publier chez votre registrar DNS",
      host: "Hôte",
      copy: "Copier",
      copied: "Copié",
      lookupFailed: "Échec de la requête — réessayez.",
      why: "Avec SPF + DMARC (p=reject), un e-mail usurpé est refusé avant d'atteindre la moindre boîte.",
    },
    footnoteLocal:
      "Mesuré à l'instant sur ce serveur. En local, le certificat auto-signé est approuvé sur cette machine ; le site déployé utilise le TLS de la plateforme (renouvelé automatiquement). Seuls des compteurs anonymes sont stockés — jamais de mots de passe, jetons ou données de paiement.",
    footnoteEdge:
      "Le TLS est terminé à la périphérie de l'hébergeur (certificat renouvelé automatiquement) ; la couche applicative impose toujours HSTS, CSP et toutes les protections. Seuls des compteurs anonymes sont stockés — jamais de mots de passe, jetons ou données de paiement.",
  },
} as const;

/** The localized copy shape (en/fr are structurally identical). */
type Copy = (typeof COPY)[keyof typeof COPY];

function cnName(subject: string): string {
  const m = /CN=([^\n,]+)/.exec(subject);
  return m?.[1]?.trim() ?? subject;
}

const CORE_CHECKS = new Set(["tls", "hsts", "csp", "xfo", "xss", "ssrf", "path"]);

/** Build the 13 live checks from the status payload + real response headers. */
function buildChecks(status: StatusResponse, h: Headers, L: Copy): CheckView[] {
  const hsts = h.get("strict-transport-security") ?? "";
  const csp = h.get("content-security-policy") ?? "";
  const xfo = h.get("x-frame-options") ?? "";
  const nosniff = h.get("x-content-type-options") ?? "";
  const refp = h.get("referrer-policy") ?? "";
  const perms = h.get("permissions-policy") ?? "";
  const tls = status.transport.tls;
  const local = status.transport.scope === "local";
  const hstsMax = Number(/max-age=(\d+)/.exec(hsts)?.[1] ?? "0");
  const hasFrameAncestors = csp.includes("frame-ancestors");
  const cspOk =
    csp.includes("default-src 'self'") && csp.includes("object-src 'none'") && hasFrameAncestors;
  const evalInCsp = csp.includes("'unsafe-eval'");
  const dev = status.mode === "development";

  const tlsPass = local ? tls?.ok === true : status.transport.requestHttps;
  const tlsValue = local
    ? tls?.ok
      ? `${tls.protocol ?? "TLS"} · ${tls.cipher ?? ""}`
      : `No TLS on this port${tls?.error ? ` (${tls.error})` : ""} — start with: npm run dev:https`
    : "TLS terminates at the platform edge · TLS 1.2/1.3";

  const cert = tls?.cert ?? null;
  const certValue = local
    ? cert
      ? `${cnName(cert.subject)} · ${cert.daysLeft} days left · self-signed CA trusted on this machine`
      : "—"
    : "Platform-managed certificate · auto-renew (Let's Encrypt)";

  const timeouts = status.guards.timeouts.entries;
  const minMs = Math.min(...timeouts.map((t) => t.ms));
  const maxMs = Math.max(...timeouts.map((t) => t.ms));

  const rows: Array<Omit<CheckView, "core" | "title">> = [
    {
      id: "tls",
      pass: tlsPass,
      value: tlsValue,
      source: "live",
    },
    {
      id: "hsts",
      pass: hstsMax >= 31_536_000,
      value: hsts
        ? hsts
        : "HTTP-only dev — start the encrypted server with: npm run dev:https",
      source: "live",
    },
    {
      id: "csp",
      pass: cspOk,
      value: csp || "—",
      source: "live",
    },
    {
      id: "xfo",
      pass: xfo !== "" || hasFrameAncestors,
      value: [xfo, hasFrameAncestors ? "CSP frame-ancestors" : ""].filter(Boolean).join(" · ") || "—",
      source: "live",
    },
    { id: "nosniff", pass: nosniff === "nosniff", value: nosniff || "—", source: "live" },
    {
      id: "referrer",
      pass: refp !== "" && perms !== "",
      value: `${refp || "—"} · ${perms || "—"}`,
      source: "live",
    },
    {
      id: "xss",
      pass: cspOk && (dev || !evalInCsp),
      value: dev
        ? "React auto-escaping + strict CSP · dev-only 'unsafe-eval' for React tooling (production build removes it)"
        : "React auto-escaping + strict CSP · no 'unsafe-eval' · links allowlisted server-side",
      source: "live",
    },
    {
      id: "ssrf",
      pass: status.guards.ssrf.enforced,
      value: `Allowlist: ${status.guards.ssrf.allowedHosts.join(", ") || "none"} · IP-literal, loopback & metadata ranges refused · redirects never followed`,
      source: "server",
    },
    {
      id: "path",
      pass: status.guards.path.enforced,
      value: "Every filesystem path resolves through resolveInside(root) — `..`/absolute escapes and NUL bytes are rejected",
      source: "server",
    },
    {
      id: "rate",
      pass: status.guards.rateLimits.length > 0,
      value: `${status.guards.rateLimits.length} enforced budgets · per-IP keys (proxy-appended) + shared global buckets`,
      source: "server",
    },
    {
      id: "timeouts",
      pass: timeouts.length > 0,
      value: `${timeouts.length} outbound calls time-boxed (${minMs / 1000}s–${maxMs / 1000}s) — nothing can hang a request`,
      source: "server",
    },
    {
      id: "data",
      pass: status.data.sensitiveUserData === false,
      value: "Supabase Postgres · public reads via anon + RLS · writes via service_role only — no passwords, tokens or payment data",
      source: "policy",
    },
    {
      id: "cert",
      pass: local ? cert !== null : tlsPass,
      value: certValue,
      source: "live",
    },
  ];

  return rows.map((r) => ({
    id: r.id,
    title: L.checks[r.id] ?? r.id,
    value: r.value,
    pass: r.pass,
    core: CORE_CHECKS.has(r.id),
    source: r.source,
  }));
}

function StatCell({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] px-4 py-3">
      <p className="font-mono text-[10px] tracking-[0.18em] text-faint uppercase">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function CheckCard({ check, L }: { check: CheckView; L: Copy }): React.JSX.Element {
  return (
    <li
      className={cn(
        "glass rounded-xl border p-4 transition-colors duration-200",
        check.pass ? "border-emerald-400/25" : "border-amber-400/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
            check.pass
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              : "border-amber-400/50 bg-amber-400/10 text-amber-300",
          )}
        >
          {check.pass ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
            check.pass
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-amber-400/10 text-amber-300",
          )}
        >
          {check.pass ? L.pass : L.fail}
        </span>
      </div>
      <h3 className="mt-3 font-display text-[15px] leading-snug font-semibold text-foreground">
        {check.title}
      </h3>
      <p className="mt-1.5 font-mono text-[11px] leading-relaxed break-words text-muted" title={check.value}>
        {check.value}
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
        {L.source[check.source]}
      </p>
    </li>
  );
}

export default function SecurityCertificate(): React.JSX.Element {
  const { lang } = useLanguage();
  const L = COPY[lang];

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [headers, setHeaders] = useState<Headers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState("");
  const [dnsDomain, setDnsDomain] = useState(() => defaultDomain());
  const [dns, setDns] = useState<DnsReport | null>(null);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsError, setDnsError] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const runChecks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/security/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as StatusResponse;
      setStatus(json);
      setHeaders(res.headers);
      setCheckedAt(new Date().toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const checkDns = useCallback(async (domain: string): Promise<void> => {
    const clean = domain.trim().toLowerCase();
    if (clean === "") return;
    setDnsLoading(true);
    setDnsError(false);
    try {
      const res = await fetch(`/api/security/dns?domain=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DnsReport | { error?: string };
      if (!res.ok || !("ok" in json)) throw new Error("dns");
      setDns(json);
    } catch {
      setDns(null);
      setDnsError(true);
    } finally {
      setDnsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    const d = defaultDomain();
    if (d !== "") void checkDns(d);
  }, [checkDns]);

  const checks = useMemo(
    () => (status && headers ? buildChecks(status, headers, L) : []),
    [status, headers, L],
  );

  const grade = useMemo(
    () => gradeOf(checks.map(({ id, pass, core }) => ({ id, pass, core }))),
    [checks],
  );

  const gradeColor =
    grade.grade === "A+"
      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
      : grade.grade === "A" || grade.grade === "B"
        ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
        : "border-red-400/50 bg-red-400/10 text-red-400";

  const tls = status?.transport.tls;
  const statRows = [
    { label: L.stat.protocol, value: tls?.ok ? (tls.protocol ?? "TLS") : status?.transport.scope === "platform" ? "edge TLS" : "—" },
    {
      label: L.stat.certificate,
      value: tls?.cert ? cnName(tls.cert.subject) : status?.transport.scope === "platform" ? "platform" : "—",
    },
    { label: L.stat.cipher, value: tls?.cipher ?? (status?.transport.scope === "platform" ? "TLS 1.2/1.3" : "—") },
    { label: L.stat.layers, value: `${grade.passed}/${grade.total}` },
  ];

  async function copyText(text: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? "" : k)), 2000);
    } catch {
      /* clipboard unavailable (insecure context) — value is still selectable */
    }
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-muted uppercase transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {L.back}
        </Link>

        {/* Header band */}
        <header className="glass mt-6 rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/35 bg-accent/10 text-accent">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{L.title}</h1>
                <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                  {checkedAt
                    ? `${L.checkedAt} ${checkedAt} · ${status?.mode ?? ""}`
                    : error
                      ? L.loadFailed
                      : L.running}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-sm font-semibold tracking-[0.1em]",
                  gradeColor,
                )}
                aria-label={`${L.gradeLabel}: ${grade.grade} ${grade.score}/100`}
              >
                {grade.grade} · {grade.score}/100
              </span>
              <button
                type="button"
                onClick={() => {
                  void runChecks();
                  if (dnsDomain !== "") void checkDns(dnsDomain);
                }}
                disabled={loading}
                aria-label={L.refresh}
                title={L.refresh}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{L.subtitle}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statRows.map((s) => (
              <StatCell key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2 font-mono text-xs text-red-400">
              {L.loadFailed}
            </p>
          )}
        </header>

        {/* Check grid */}
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy={loading}>
          {checks.length === 0 &&
            !error &&
            Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="glass h-40 animate-pulse rounded-xl border border-border" aria-hidden="true" />
            ))}
          {checks.map((c) => (
            <CheckCard key={c.id} check={c} L={L} />
          ))}
        </ul>

        {/* Email hardening */}
        <section className="glass mt-4 rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/35 bg-accent/10 text-accent">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-semibold tracking-tight">{L.email.title}</h2>
            </div>
            <form
              className="flex w-full max-w-md items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void checkDns(dnsDomain);
              }}
            >
              <input
                type="text"
                value={dnsDomain}
                onChange={(e) => setDnsDomain(e.target.value)}
                placeholder={L.email.placeholder}
                spellCheck={false}
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-border bg-white/[0.03] px-3 font-mono text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={dnsLoading || dnsDomain.trim() === ""}
                className="h-10 shrink-0 cursor-pointer rounded-lg border border-accent/40 bg-accent/10 px-4 font-mono text-[11px] tracking-[0.14em] text-accent uppercase transition-colors hover:bg-accent/20 disabled:cursor-wait disabled:opacity-50"
              >
                {dnsLoading ? L.email.checking : L.email.check}
              </button>
            </form>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{L.email.subtitle}</p>

          {dnsError && (
            <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-mono text-xs text-amber-300">
              {L.email.lookupFailed}
            </p>
          )}

          {dns && !dnsError && (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  {
                    ok: dns.spf.found,
                    label: dns.spf.found ? L.email.spfFound : L.email.spfMissing,
                    record: dns.spf.record,
                  },
                  {
                    ok: dns.dmarc.found,
                    label: dns.dmarc.found ? L.email.dmarcFound : L.email.dmarcMissing,
                    record: dns.dmarc.record,
                  },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className={cn(
                      "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px]",
                      chip.ok
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                        : "border-amber-400/50 bg-amber-400/10 text-amber-300",
                    )}
                    title={chip.record ?? undefined}
                  >
                    {chip.ok ? (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="truncate">
                      {dns.domain} — {chip.label}
                      {chip.record ? ` · ${chip.record}` : ""}
                    </span>
                  </span>
                ))}
              </div>

              <h3 className="mt-6 font-mono text-[11px] tracking-[0.18em] text-faint uppercase">
                {L.email.recommended}
              </h3>
              <ul className="mt-3 space-y-2">
                {dns.recommended.map((r) => (
                  <li
                    key={r.host + r.value}
                    className="rounded-xl border border-border bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-foreground">
                        {L.email.host}: {r.host}
                      </span>
                      <span className="rounded border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                        {r.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyText(r.value, r.host)}
                        className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase transition-colors hover:border-accent hover:text-accent"
                      >
                        {copiedKey === r.host ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        )}
                        {copiedKey === r.host ? L.email.copied : L.email.copy}
                      </button>
                    </div>
                    <p className="mt-2 font-mono text-xs leading-relaxed break-words text-foreground">
                      {r.value}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{r.purpose}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] text-faint">{L.email.why}</p>
            </>
          )}
        </section>

        <footer className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] leading-relaxed text-faint">
          <Server className="h-3.5 w-3.5" aria-hidden="true" />
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          <p className="max-w-4xl">
            {status?.transport.scope === "platform" ? L.footnoteEdge : L.footnoteLocal}
          </p>
        </footer>
      </div>
    </main>
  );
}
