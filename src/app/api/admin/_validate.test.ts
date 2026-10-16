import { describe, expect, it } from "vitest";
import { isSafeImage, isSafeLink, sanitizeRow } from "./_validate";

describe("isSafeLink — stored-XSS killer", () => {
  it("accepts https and same-origin paths", () => {
    expect(isSafeLink("https://github.com/budiabdallah20/kayan")).toBe(true);
    expect(isSafeLink("/images/projects/elearning.svg")).toBe(true);
  });
  it("rejects javascript:/data:/protocol-relative URLs", () => {
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
    expect(isSafeLink("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeLink("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeLink("//evil.com/x")).toBe(false);
    expect(isSafeLink("vbscript:msgbox(1)")).toBe(false);
  });
  it("rejects whitespace/control chars and oversized input", () => {
    expect(isSafeLink("https://a.com/x y")).toBe(false);
    expect(isSafeLink('https://a.com/"onmouseover="x')).toBe(false);
    expect(isSafeLink("")).toBe(false);
    expect(isSafeLink("x".repeat(501))).toBe(false);
  });
});

describe("isSafeImage", () => {
  it("accepts https/relative/data-image sources", () => {
    expect(isSafeImage("https://cdn.example.com/a.png")).toBe(true);
    expect(isSafeImage("/images/general/hero.jpg")).toBe(true);
    expect(isSafeImage("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
  });
  it("rejects scripted SVGs and non-image data URLs", () => {
    expect(isSafeImage("data:image/svg+xml,<svg onload=alert(1)>")).toBe(false);
    expect(isSafeImage("data:text/html,<h1>x</h1>")).toBe(false);
    expect(isSafeImage("data:image/svg+xml,<svg><script>alert(1)</script></svg>")).toBe(false);
  });
});

describe("sanitizeRow", () => {
  it("strips unknown columns and validates the id", () => {
    const r = sanitizeRow("skills", {
      id: "skill-react",
      name: "React",
      evil: "drop me",
      __proto__: { x: 1 },
    });
    expect(r.ok).toBe(true);
    expect(r.clean).toMatchObject({ id: "skill-react", name: "React" });
    expect("evil" in (r.clean ?? {})).toBe(false);
  });
  it("rejects bad ids and hostile URLs", () => {
    expect(sanitizeRow("skills", { id: "../../etc" }).ok).toBe(false);
    expect(
      sanitizeRow("projects", { id: "p1", title: "T", demo: "javascript:alert(1)" }).ok,
    ).toBe(false);
    expect(sanitizeRow("projects", { id: "p1", title: "T", demo: "https://demo.example.com" }).ok).toBe(
      true,
    );
  });
  it("rejects oversized text and out-of-range ints", () => {
    expect(sanitizeRow("skills", { id: "s", name: "x".repeat(41) }).ok).toBe(false);
    expect(sanitizeRow("skills", { id: "s", name: "N", level: 999 }).ok).toBe(false);
  });
});
