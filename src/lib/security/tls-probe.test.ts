import { describe, expect, it } from "vitest";
import { isLoopbackName, normalizeHostname } from "./tls-probe";

describe("normalizeHostname", () => {
  it("splits host and port, brackets and all", () => {
    expect(normalizeHostname("localhost:8443")).toEqual({ hostname: "localhost", port: 8443 });
    expect(normalizeHostname("LOCALHOST")).toEqual({ hostname: "localhost", port: null });
    expect(normalizeHostname("[::1]:8443")).toEqual({ hostname: "::1", port: 8443 });
    expect(normalizeHostname("evil.com:80")).toEqual({ hostname: "evil.com", port: 80 });
  });

  it("rejects out-of-range or non-numeric ports", () => {
    expect(normalizeHostname("localhost:99999")).toEqual({ hostname: "localhost", port: null });
    expect(normalizeHostname("localhost:0")).toEqual({ hostname: "localhost", port: null });
    expect(normalizeHostname("localhost:abc")).toEqual({ hostname: "localhost:abc", port: null });
  });
});

describe("isLoopbackName — exact spellings only", () => {
  it("accepts the three loopback names", () => {
    for (const host of ["localhost", "127.0.0.1", "::1"]) {
      expect(isLoopbackName(host), host).toBe(true);
    }
  });

  it("rejects subdomains and lookalikes (no DNS resolution risk)", () => {
    for (const host of ["foo.localhost", "localhost.evil.com", "127.0.0.1.evil.com", "0.0.0.0"]) {
      expect(isLoopbackName(host), host).toBe(false);
    }
  });
});
