import { describe, expect, it } from "vitest";
import { assertSafeOutboundUrl, isPrivateOrLiteralHost } from "./outbound";

describe("isPrivateOrLiteralHost — the SSRF core", () => {
  it("blocks loopback, private ranges and metadata", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.8",
      "172.16.0.1",
      "169.254.169.254", // AWS/GCP metadata
      "0.0.0.0",
      "::1",
      "fe80::1",
      "foo.local",
      "box.internal",
      "svc.home.arpa",
      "site.onion",
    ]) {
      expect(isPrivateOrLiteralHost(host), host).toBe(true);
    }
  });
  it("allows ordinary public hostnames", () => {
    for (const host of ["dns.google", "api.aladhan.com", "budi-portfolio.vercel.app"]) {
      expect(isPrivateOrLiteralHost(host), host).toBe(false);
    }
  });
});

describe("assertSafeOutboundUrl — allowlist + scheme + port", () => {
  const allowed = ["dns.google"];

  it("accepts an allowlisted https URL on 443", () => {
    const url = assertSafeOutboundUrl("https://dns.google/resolve?name=x.com&type=TXT", allowed);
    expect(url.hostname).toBe("dns.google");
  });

  it("rejects non-https, credentials, odd ports and non-allowlisted hosts", () => {
    expect(() => assertSafeOutboundUrl("http://dns.google/resolve", allowed)).toThrow(/https only/);
    expect(() => assertSafeOutboundUrl("https://user:pw@dns.google/", allowed)).toThrow(/credentials/);
    expect(() => assertSafeOutboundUrl("https://dns.google:8443/", allowed)).toThrow(/port 443/);
    expect(() => assertSafeOutboundUrl("https://evil-host.com/", allowed)).toThrow(/not allowlisted/);
  });

  it("rejects IP-literal and private targets even if they were allowlisted", () => {
    expect(() => assertSafeOutboundUrl("https://127.0.0.1/", ["127.0.0.1"])).toThrow(/private/);
    expect(() => assertSafeOutboundUrl("https://169.254.169.254/latest/meta-data", ["169.254.169.254"])).toThrow(
      /private/,
    );
    // Decimal form — the URL parser normalizes it to 127.0.0.1 before we vet.
    expect(() => assertSafeOutboundUrl("https://2130706433/", ["127.0.0.1"])).toThrow(/private/);
  });

  it("rejects malformed URLs", () => {
    expect(() => assertSafeOutboundUrl("not a url", allowed)).toThrow(/malformed/);
  });
});
