import { describe, expect, it } from "vitest";
import { getProjectAvailability, projectPublicTags, setProjectAvailability, setProjectPublicTags } from "./project-availability";

describe("project availability stored in existing project fields", () => {
  const base = { status: "completed" as const, tags: ["React", "Next.js"] };
  it("preserves ordinary tags when moving through states", () => {
    const maintenance = setProjectAvailability(base, "maintenance", "2026-12-15");
    expect(getProjectAvailability(maintenance)).toEqual({ state: "maintenance", deadline: "2026-12-15" });
    expect(projectPublicTags(maintenance.tags)).toEqual(base.tags);
    const progress = setProjectAvailability(maintenance, "in-progress", "");
    expect(getProjectAvailability(progress)).toEqual({ state: "in-progress", deadline: "" });
    expect(projectPublicTags(progress.tags)).toEqual(base.tags);
  });
  it("keeps the deadline while editing public tags", () => {
    const project = setProjectAvailability(base, "maintenance", "2026-12-15");
    const edited = setProjectPublicTags(project, ["TypeScript"]);
    expect(projectPublicTags(edited.tags)).toEqual(["TypeScript"]);
    expect(getProjectAvailability(edited)).toEqual({ state: "maintenance", deadline: "2026-12-15" });
  });
});
