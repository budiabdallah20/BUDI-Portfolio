/**
 * SPF / DMARC live checker — DNS-over-HTTPS against a single allowlisted
 * resolver (dns.google), behind the SSRF guard (lib/security/outbound.ts).
 *
 * Why DoH: the server never touches UDP:53 (often blocked, spoofable), and
 * every query goes through the SAME vetted outbound path as the rest of the
 * app — timeout, size cap, no redirects, host allowlist.
 *
 * The result feeds the /security certificate page:
 * - what the domain publishes TODAY (queried live),
 * - exactly which records to publish to close the gap.
 */

import { safeFetchJson } from "./outbound";

export const DOH_ENDPOINT = "https://dns.google/resolve";
export const DOH_ALLOWED_HOSTS = ["dns.google"] as const;
const DOH_TIMEOUT_MS = 5_000;

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Valid public hostname, nothing that could ever name an internal target. */
export function isValidDomainName(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!DOMAIN_RE.test(v)) return false;
  // Reject things that pretend to be hostnames but resolve inside.
  if (v.includes("..") || v.startsWith("-") || v.endsWith("-")) return false;
  const tld = v.split(".").pop() ?? "";
  return !["local", "localhost", "internal", "lan", "home", "test", "invalid", "arpa"].includes(tld);
}

interface DohAnswer {
  type?: number;
  data?: string;
}

/** DoH TXT `data` is quoted, possibly in multiple chunks: "\"a\" \"b\"". */
function unquoteTxt(data: string): string {
  return data
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/"\s+"/g, "")
    .trim();
}

/** Pull every TXT string out of a DoH JSON response. */
export function parseDohTxt(json: unknown): string[] {
  const answers = (json as { Answer?: DohAnswer[] } | null)?.Answer;
  if (!Array.isArray(answers)) return [];
  return answers
    .filter((a) => a?.type === 16 && typeof a.data === "string")
    .map((a) => unquoteTxt(a.data as string))
    .filter((s) => s !== "");
}

export function findSpfTxt(txts: string[]): string | null {
  return txts.find((t) => /^v=spf1(\s|$)/i.test(t)) ?? null;
}

export function findDmarcTxt(txts: string[]): string | null {
  return txts.find((t) => /^v=DMARC1\s*;/i.test(t)) ?? null;
}

export interface EmailAuthRecord {
  host: string;
  type: "TXT";
  value: string;
  purpose: string;
}

export interface EmailAuthReport {
  domain: string;
  spf: { found: boolean; record: string | null };
  dmarc: { found: boolean; record: string | null };
  /** Records to publish — strict defaults for a domain that sends no mail. */
  recommended: EmailAuthRecord[];
  queriedAt: string;
}

export function recommendedRecords(domain: string): EmailAuthRecord[] {
  return [
    {
      host: "@",
      type: "TXT",
      value: "v=spf1 -all",
      purpose:
        "SPF: this domain sends NO email. If a provider does send for you, replace -all with that provider's include: (e.g. include:_spf.google.com ~all).",
    },
    {
      host: "_dmarc",
      type: "TXT",
      value: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc@${domain}; fo=1`,
      purpose:
        "DMARC: reject spoofed mail outright (start with p=none for a week of reports if unsure), strict alignment, aggregate reports to rua.",
    },
    {
      host: "<selector>._domainkey",
      type: "TXT",
      value: "v=DKIM1; k=rsa; p=<public key from your mail provider>",
      purpose:
        "DKIM: publish the 2048-bit public key your mail provider generated. With SPF+DMARC this completes authentication.",
    },
  ];
}

async function dohQuery(name: string, type: "TXT"): Promise<unknown> {
  const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=${type}`;
  return safeFetchJson(url, {
    allowedHosts: DOH_ALLOWED_HOSTS,
    timeoutMs: DOH_TIMEOUT_MS,
    maxBytes: 64 * 1024,
  });
}

/** Query SPF + DMARC for one validated domain. Throws readable errors. */
export async function checkEmailAuth(domain: string): Promise<EmailAuthReport> {
  const clean = domain.trim().toLowerCase();
  if (!isValidDomainName(clean)) throw new Error("Invalid domain name");

  const [rootJson, dmarcJson] = await Promise.all([
    dohQuery(clean, "TXT"),
    dohQuery(`_dmarc.${clean}`, "TXT"),
  ]);

  const spf = findSpfTxt(parseDohTxt(rootJson));
  const dmarc = findDmarcTxt(parseDohTxt(dmarcJson));

  return {
    domain: clean,
    spf: { found: spf !== null, record: spf },
    dmarc: { found: dmarc !== null, record: dmarc },
    recommended: recommendedRecords(clean),
    queriedAt: new Date().toISOString(),
  };
}
