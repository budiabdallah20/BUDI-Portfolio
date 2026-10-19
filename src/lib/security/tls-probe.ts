/**
 * Live TLS probe — proves (or disproves) that the server a request landed
 * on actually speaks TLS, and reports the REAL negotiated protocol, cipher
 * and certificate. The /security certificate page displays exactly this.
 *
 * How it works: on loopback hosts (the local dev machine) the handler opens
 * a throwaway TLS client connection back to `host:port` — the same address
 * the browser used — and reads the handshake. No guesswork, no static copy.
 *
 * SAFETY: callers must pass loopback/private hosts only. The probe never
 * accepts a URL from user input; it is fed from the request's own Host
 * header after strict validation (see api/security/status/route.ts).
 */

import tls from "node:tls";

export interface TlsProbeResult {
  ok: boolean;
  /** Negotiated TLS version, e.g. "TLSv1.3". */
  protocol?: string;
  /** Negotiated cipher suite, e.g. "TLS_AES_256_GCM_SHA384". */
  cipher?: string;
  cert?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint256: string;
    daysLeft: number;
  } | null;
  error?: string;
}

/** Normalize "[::1]" → "::1" and lowercase. */
export function normalizeHostname(hostHeader: string): { hostname: string; port: number | null } {
  const raw = hostHeader.trim().toLowerCase();
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    if (end === -1) return { hostname: raw, port: null };
    const hostname = raw.slice(1, end);
    const rest = raw.slice(end + 1);
    const port = rest.startsWith(":") ? Number(rest.slice(1)) : NaN;
    return { hostname, port: Number.isInteger(port) && port > 0 && port <= 65_535 ? port : null };
  }
  const idx = raw.lastIndexOf(":");
  if (idx !== -1 && /^\d+$/.test(raw.slice(idx + 1))) {
    const port = Number(raw.slice(idx + 1));
    return { hostname: raw.slice(0, idx), port: port > 0 && port <= 65_535 ? port : null };
  }
  return { hostname: raw, port: null };
}

/**
 * EXACT loopback spellings only. `*.localhost` is deliberately rejected:
 * on Windows the OS resolver is not required to map it to loopback, so a
 * forged `Host: evil.localhost` must never reach a DNS-resolved target.
 */
export function isLoopbackName(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function probeTls(
  hostname: string,
  port: number,
  timeoutMs = 4_000,
): Promise<TlsProbeResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: TlsProbeResult): void => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* already gone */
      }
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: hostname,
        port,
        // Loopback self-signed cert — we report its details instead of
        // validating a chain we already installed into the OS trust store.
        rejectUnauthorized: false,
        servername: hostname === "127.0.0.1" || hostname === "::1" ? "localhost" : hostname,
        timeout: timeoutMs,
      },
      () => {
        const cert = socket.getPeerX509Certificate();
        let certInfo: TlsProbeResult["cert"] = null;
        if (cert) {
          const validTo = new Date(cert.validTo);
          certInfo = {
            subject: cert.subject ?? "",
            issuer: cert.issuer ?? "",
            validFrom: new Date(cert.validFrom).toISOString(),
            validTo: cert.validTo,
            fingerprint256: cert.fingerprint256 ?? "",
            daysLeft: Math.floor((validTo.getTime() - Date.now()) / 86_400_000),
          };
        }
        const cipher = socket.getCipher();
        finish({
          ok: true,
          protocol: socket.getProtocol() ?? undefined,
          cipher: cipher?.name,
          cert: certInfo,
        });
      },
    );

    socket.once("timeout", () => finish({ ok: false, error: "timeout" }));
    socket.once("error", (err: Error) =>
      finish({ ok: false, error: err.message || "handshake failed" }),
    );
    // Belt and braces: a peer FIN during handshake must never hang the probe.
    socket.once("close", () => finish({ ok: false, error: "connection closed" }));
  });
}
