import { describe, expect, it } from "vitest";
import { clientIp, rateLimit } from "./rate-limit";

function reqWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/x", { headers });
}

describe("clientIp — spoof resistance", () => {
  it("takes the TAIL of x-forwarded-for (platform-appended = real)", () => {
    const req = reqWith({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIp(req)).toBe("5.6.7.8");
  });
  it("ignores a lone attacker-supplied header value safely", () => {
    // Single value: nothing to choose — still counted, but the GLOBAL
    // bucket in _guard blunts rotation. Tail-selection removes the
    // trivial single-header bypass when a proxy appends the real IP.
    const req = reqWith({ "x-forwarded-for": "9.9.9.9" });
    expect(clientIp(req)).toBe("9.9.9.9");
  });
  it("falls back to x-real-ip then local", () => {
    expect(clientIp(reqWith({ "x-real-ip": "7.7.7.7" }))).toBe("7.7.7.7");
    expect(clientIp(reqWith({}))).toBe("local");
  });
});

describe("rateLimit — fixed window", () => {
  it("allows max hits then 429s with retryAfterSec", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000)).toEqual({ ok: true });
    expect(rateLimit(key, 2, 60_000)).toEqual({ ok: true });
    const third = rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.retryAfterSec).toBeGreaterThan(0);
  });
});
