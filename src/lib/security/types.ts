/**
 * Wire types shared by /api/security/status and the /security page.
 * Type-only module — safe to `import type` from client components.
 */

import type { TlsProbeResult } from "./tls-probe";
import type { RateLimitFact } from "./limits";

export interface TimeoutFact {
  where: string;
  ms: number;
  note: string;
}

export interface StatusGuards {
  ssrf: {
    enforced: true;
    allowedHosts: readonly string[];
    rules: string[];
  };
  path: {
    enforced: true;
    rules: string[];
  };
  timeouts: {
    enforced: true;
    entries: TimeoutFact[];
  };
  rateLimits: readonly RateLimitFact[];
  maxBodyBytes: number;
}

export interface StatusData {
  store: string;
  sensitiveUserData: false;
  notes: string[];
}

export interface StatusTransport {
  /** "local" when the request landed on loopback, "platform" otherwise. */
  scope: "local" | "platform";
  requestHttps: boolean;
  /** Live handshake read-back (loopback only — null on hosted platforms). */
  tls: TlsProbeResult | null;
}

export interface StatusResponse {
  ok: true;
  at: string;
  mode: "development" | "production";
  node: string;
  transport: StatusTransport;
  guards: StatusGuards;
  data: StatusData;
}
