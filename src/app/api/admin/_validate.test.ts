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

describe("dashboard field batch — extended columns survive the gate", () => {
  it("accepts extended service fields and canonicalizes FAQ entries", () => {
    const r = sanitizeRow("services", {
      id: "srv-x",
      title: "T",
      startingPrice: "$500",
      currency: "USD",
      ctaLink: "https://wa.me/123",
      faq: [{ qEn: "Q", aEn: "A", qFr: "Qf", aFr: "Af", evil: "drop me" }],
      popular: true,
      deliveryDays: 7,
      revisions: 2,
      iconColor: "#ff3d00",
    });
    expect(r.ok).toBe(true);
    expect(r.clean).toMatchObject({ startingPrice: "$500", popular: true, deliveryDays: 7 });
    expect(r.clean?.faq).toEqual([{ qEn: "Q", aEn: "A", qFr: "Qf", aFr: "Af" }]);
  });
  it("rejects hostile links, malformed FAQ, bad gallery images and bad ints", () => {
    expect(sanitizeRow("services", { id: "s", title: "T", ctaLink: "javascript:alert(1)" }).ok).toBe(
      false,
    );
    expect(sanitizeRow("services", { id: "s", title: "T", faq: [{ qEn: 1 }] }).ok).toBe(false);
    expect(sanitizeRow("services", { id: "s", title: "T", deliveryDays: 999 }).ok).toBe(false);
    expect(
      sanitizeRow("projects", { id: "p", title: "T", gallery: ["data:text/html,x"] }).ok,
    ).toBe(false);
    expect(sanitizeRow("projects", { id: "p", title: "T", teamSize: 0 }).ok).toBe(false);
    expect(
      sanitizeRow("projects", {
        id: "p",
        title: "T",
        gallery: ["data:image/png;base64,iVBORw0KGgo=", "/images/projects/x.svg"],
      }).ok,
    ).toBe(true);
  });
  it("keeps skill years/order/featured and settings SEO fields", () => {
    const skill = sanitizeRow("skills", {
      id: "skill-x",
      name: "X",
      years: 3,
      featured: true,
      order: 2,
      learningNow: false,
    });
    expect(skill.ok).toBe(true);
    expect(skill.clean).toMatchObject({ years: 3, featured: true, order: 2 });
    const settings = sanitizeRow("settings", { id: "site", seoTitle: "BUDI", robotsIndex: false });
    expect(settings.ok).toBe(true);
    expect(settings.clean).toMatchObject({ seoTitle: "BUDI", robotsIndex: false });
    expect(sanitizeRow("settings", { id: "site", robotsIndex: "yes" }).ok).toBe(false);
  });
});
