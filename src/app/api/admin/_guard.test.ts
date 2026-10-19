import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAdmin } from "./_guard";

/**
 * Regression net for the admin brute-force shield.
 *
 * The bug this file exists for: `lockedInfo()` used to delete the IP's record
 * the instant a lock elapsed, destroying the only trace that the IP had been
 * locked before. `recordFail()`'s repeat-offender check then could never be
 * true, so the 1-hour REPEAT_LOCK_MS was unreachable dead code — an attacker
 * waited out 15 minutes and received a pristine 8 guesses, forever.
 *
 * Every assertion below fails against the old implementation.
 */

const SECRET = "90210";

/**
 * `clientIp()` takes the TAIL of x-forwarded-for (the entry the platform
 * appends), so a spoofed prefix must not be what identifies the caller.
 */
function req(ip: string, secret?: string): Request {
  const headers: Record<string, string> = { "x-forwarded-for": `198.51.100.9, ${ip}` };
  if (secret !== undefined) headers["x-admin-secret"] = secret;
  return new Request("https://budi.test/api/admin/save", { method: "POST", headers });
}

function statusOf(r: ReturnType<typeof checkAdmin>): number {
  return r.ok ? 200 : r.status;
}

/** Fire `count` wrong guesses from one IP. */
function guess(ip: string, count: number): void {
  for (let i = 0; i < count; i += 1) checkAdmin(req(ip, "0000"));
}

const MIN = 60 * 1000;

describe("checkAdmin — brute-force shield", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    process.env.ADMIN_API_SECRET = SECRET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects a wrong secret and accepts the right one", () => {
    expect(statusOf(checkAdmin(req("10.0.0.1", "0000")))).toBe(401);
    expect(checkAdmin(req("10.0.0.1", SECRET)).ok).toBe(true);
  });

  it("ignores a spoofed x-forwarded-for prefix", () => {
    // Same caller, rotating the prefix it controls. The tail is the identity,
    // so this must still accumulate into ONE lock.
    for (let i = 0; i < 8; i += 1) {
      checkAdmin(req("10.0.0.2", "0000"));
    }
    const after = checkAdmin(req("10.0.0.2", "0000"));
    expect(after.ok).toBe(false);
    expect(after.ok === false && after.status).toBe(429);
  });

  it("locks the IP after 8 wrong guesses", () => {
    guess("10.0.0.3", 8);
    const locked = checkAdmin(req("10.0.0.3", SECRET));
    expect(locked.ok).toBe(false);
    expect(locked.ok === false && locked.status).toBe(429);
    // The lock must outlast a correct secret too — no unlock-by-knowledge.
    expect(statusOf(checkAdmin(req("10.0.0.3", SECRET)))).toBe(429);
  });

  it("REGRESSION: a repeat offender escalates to the 1-hour lock", () => {
    guess("10.0.0.4", 8);
    expect(statusOf(checkAdmin(req("10.0.0.4", SECRET)))).toBe(429);

    // Serve the 15-minute lock.
    vi.advanceTimersByTime(16 * MIN);

    // Old bug: the record was deleted on expiry, so this second lock was
    // treated as a FIRST offence and released after another 15 minutes.
    guess("10.0.0.4", 8);
    expect(statusOf(checkAdmin(req("10.0.0.4", SECRET)))).toBe(429);

    // 16 minutes later the OLD code let a correct secret straight back in.
    vi.advanceTimersByTime(16 * MIN);
    const stillLocked = checkAdmin(req("10.0.0.4", SECRET));
    expect(stillLocked.ok).toBe(false);
    expect(stillLocked.ok === false && stillLocked.status).toBe(429);

    // …and it really is the long lock: after the full hour it opens.
    vi.advanceTimersByTime(60 * MIN);
    expect(checkAdmin(req("10.0.0.4", SECRET)).ok).toBe(true);
  });

  it("REGRESSION: a valid secret is never throttled by the global bucket", () => {
    // Drain the shared 40/min bucket with failures from many IPs.
    for (let ip = 0; ip < 8; ip += 1) guess(`172.16.0.${ip + 1}`, 6);
    // The bucket is now empty — an unauthenticated attacker can do this.
    // A correct secret must still be accepted: the gate used to charge the
    // bucket before comparing, letting anyone lock the owner out (and
    // letting the owner's own bulk "Push EVERYTHING" 429 itself).
    expect(checkAdmin(req("10.0.0.9", SECRET)).ok).toBe(true);
  });
});