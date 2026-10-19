import path from "node:path";
import { describe, expect, it } from "vitest";
import { isInside, resolveInside } from "./safe-path";

const ROOT = path.resolve("project-root");

describe("resolveInside — traversal containment", () => {
  it("joins normal segments inside the root", () => {
    const target = resolveInside(ROOT, "public", "videos", "birthday.mp4");
    expect(target).toBe(path.join(ROOT, "public", "videos", "birthday.mp4"));
  });

  it("accepts the root itself", () => {
    expect(resolveInside(ROOT)).toBe(ROOT);
  });

  it("rejects ../ escapes", () => {
    expect(resolveInside(ROOT, "..", "outside.txt")).toBeNull();
    expect(resolveInside(ROOT, "public", "..", "..", "secrets.env")).toBeNull();
  });

  it("rejects absolute segments (platform-native)", () => {
    const absolute =
      process.platform === "win32" ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/passwd";
    expect(resolveInside(ROOT, absolute)).toBeNull();
  });

  it("rejects NUL bytes", () => {
    expect(resolveInside(ROOT, "public", "bad\0name")).toBeNull();
  });

  it("still allows dots inside a file name", () => {
    expect(resolveInside(ROOT, "audit.log")).toBe(path.join(ROOT, "audit.log"));
  });
});

describe("isInside", () => {
  it("is true for the root and descendants, false outside", () => {
    expect(isInside(ROOT, ROOT)).toBe(true);
    expect(isInside(ROOT, path.join(ROOT, "a", "b"))).toBe(true);
    expect(isInside(ROOT, path.dirname(ROOT))).toBe(false);
    expect(isInside(ROOT, path.join(ROOT, "..", "sibling"))).toBe(false);
  });
});
