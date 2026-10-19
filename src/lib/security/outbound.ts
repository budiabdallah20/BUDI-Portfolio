/**
 * SSRF-guarded outbound fetch — the ONLY sanctioned way for server code to
 * call a third-party URL.
 *
 * Threat model (checklist item: "حظر السيرفر من إرسال طلبات لشبكات الـ
 * Internal / Localhost / Metadata"):
 * - A URL is refused unless its host is on a per-call ALLOWLIST.
 * - IP-literal hosts (127.0.0.1, 169.254.169.254, [::1], decimal/hex forms —
 *   the URL parser normalizes all of them) are refused even if allowlisted.
 * - Localhost / private suffixes (.local, .internal, …) are refused.
 * - Only https on port 443, no embedded credentials, no redirects followed
 *   (a 3xx from an allowed host must never bounce us to an internal one).
 * - Every request carries a hard timeout and a response-size cap.
 */

export const BLOCKED_HOST_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".home.arpa",
  ".lan",
  ".intranet",
  ".corp",
  ".test",
  ".invalid",
  ".example",
  ".onion",
] as const;

/** Private / loopback / link-local / metadata IPv4 ranges. */
function isPrivateIPv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // link-local + cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast / reserved
  );
}

/**
 * True for anything that could reach an internal network:
 * IP literals (v4 or bracketed v6), localhost, or a blocked suffix.
 * Everything numeric is treated as an IP literal — the URL parser has
 * already normalized decimal/hex/octal forms before we get here.
 */
export function isPrivateOrLiteralHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "" || host === "localhost") return true;
  if (host.includes(":")) return true; // IPv6 literal (URL keeps brackets off hostname? covers both)
  if (/^[\d.]+$/.test(host)) return true; // IPv4 literal (any punctuation-only-numeric form)
  return BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** Parse + vet an outbound URL. Throws a readable Error. */
export function assertSafeOutboundUrl(rawUrl: string, allowedHosts: readonly string[]): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("outbound: malformed URL");
  }
  if (url.protocol !== "https:") throw new Error("outbound: https only");
  if (url.username !== "" || url.password !== "") throw new Error("outbound: credentials not allowed");
  if (url.port !== "" && url.port !== "443") throw new Error("outbound: port 443 only");
  const host = url.hostname.toLowerCase();
  if (isPrivateOrLiteralHost(host)) throw new Error("outbound: private/loopback/metadata host blocked");
  const allowed = allowedHosts.map((h) => h.toLowerCase());
  if (!allowed.includes(host)) throw new Error(`outbound: host not allowlisted (${host})`);
  return url;
}

export interface SafeFetchOptions {
  /** HTTPS hosts this call may reach — the whole allowlist contract. */
  allowedHosts: readonly string[];
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

export const DEFAULT_OUTBOUND_TIMEOUT_MS = 6_000;
export const DEFAULT_OUTBOUND_MAX_BYTES = 512 * 1024;

/**
 * Fetch a small JSON-ish text body from an allowlisted host.
 * Never follows redirects; never streams unbounded data.
 */
export async function safeFetchText(rawUrl: string, opts: SafeFetchOptions): Promise<string> {
  const url = assertSafeOutboundUrl(rawUrl, opts.allowedHosts);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_OUTBOUND_TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? DEFAULT_OUTBOUND_MAX_BYTES;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "manual",
    headers: { accept: "application/json", ...opts.headers },
  });
  if (res.status >= 300 && res.status < 400) throw new Error("outbound: redirect blocked");
  if (!res.ok) throw new Error(`outbound: upstream ${res.status}`);
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("outbound: response too large");
  return readTextCapped(res, maxBytes);
}

/**
 * Streamed read with a hard byte cap — the limit is enforced WHILE the body
 * arrives, so a chunked flood or compression bomb is aborted mid-stream
 * instead of being buffered whole by `res.text()` first.
 */
async function readTextCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error("outbound: response too large");
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released/cancelled */
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/** safeFetchText + JSON.parse. */
export async function safeFetchJson(rawUrl: string, opts: SafeFetchOptions): Promise<unknown> {
  const text = await safeFetchText(rawUrl, opts);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("outbound: invalid JSON");
  }
}
