import { describe, expect, it } from "vitest";
import { buildSecurityHeaders, HSTS_VALUE } from "./headers";

function valueOf(headers: { key: string; value: string }[], key: string): string {
  return headers.find((h) => h.key === key)?.value ?? "";
}

describe("buildSecurityHeaders — production secure context", () => {
  const headers = buildSecurityHeaders({ dev: false, secure: true });

  it("ships the full lockdown set", () => {
    for (const key of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Cross-Origin-Opener-Policy",
      "X-Permitted-Cross-Domain-Policies",
    ]) {
      expect(valueOf(headers, key), key).not.toBe("");
    }
  });

  it("HSTS stays preload-grade (>= 1 year + subdomains)", () => {
    const hsts = valueOf(headers, "Strict-Transport-Security");
    expect(hsts).toBe(HSTS_VALUE);
    const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31_536_000);
    expect(hsts).toContain("includeSubDomains");
  });

  it("CSP has no unsafe-eval in production and locks object/base/frames", () => {
    const csp = valueOf(headers, "Content-Security-Policy");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });
});

describe("buildSecurityHeaders — dev / plain http", () => {
  it("adds unsafe-eval only in dev (React tooling)", () => {
    const dev = valueOf(buildSecurityHeaders({ dev: true, secure: true }), "Content-Security-Policy");
    expect(dev).toContain("'unsafe-eval'");
  });

  it("drops HTTPS-only headers on plain-http dev", () => {
    const headers = buildSecurityHeaders({ dev: true, secure: false });
    expect(valueOf(headers, "Strict-Transport-Security")).toBe("");
    expect(valueOf(headers, "Cross-Origin-Opener-Policy")).toBe("");
    // …but the rest of the lockdown stays on.
    expect(valueOf(headers, "X-Content-Type-Options")).toBe("nosniff");
  });
});
