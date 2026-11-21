import { describe, expect, it } from "vitest";
import { estimateScope, scopeSummary } from "./servicesData";

describe("service scope estimator", () => {
  it("uses the selected scale as the initial planning range", () => {
    expect(estimateScope("build", { scale: "prototype", modules: [] })).toMatchObject({ lower: 2, upper: 3 });
    expect(estimateScope("system", { scale: "enterprise", modules: [] })).toMatchObject({ lower: 8, upper: 12 });
  });

  it("widens the range from selected modules and deduplicates technologies", () => {
    const result = estimateScope("system", { scale: "saas", modules: ["auth", "billing", "live"] });
    expect(result).toMatchObject({ lower: 6, upper: 10 });
    expect(result.stack.filter(item => item === "PostgreSQL")).toHaveLength(1);
    expect(result.stack).toContain("Webhooks");
  });

  it("exports localized labels and indicates the range is an estimate", () => {
    const summary = scopeSummary("Maintenance", "care", { scale: "prototype", modules: ["spatial"] }, "fr");
    expect(summary).toContain("Interface 3D / animation");
    expect(summary).toContain("Estimation indicative — 3–4 semaines");
  });
});
