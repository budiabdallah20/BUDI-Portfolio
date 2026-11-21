import { describe, expect, it } from "vitest";
import { isPublicStudioProject, studioProjectLink } from "./studio-projects";

describe("Phase 01 public project eligibility", () => {
  it.each([
    { title: "Massar — Personal OS" },
    { title: "Personal OS", titleFr: "مشروع مسار" },
    { title: "Personal OS", id: "proj-massar" },
    { title: "Personal OS", github: "https://github.com/user/Massar" },
    { title: "Personal OS", demo: "https://example.test/MASSAR/" },
    { title: "Hidden project", visible: false },
  ])("excludes $title from the gallery", project => {
    expect(isPublicStudioProject(project)).toBe(false);
  });
  it("retains other published projects and avoids substring matches", () => {
    expect(isPublicStudioProject({ title: "RAQiB — Academic Operations" })).toBe(true);
    expect(isPublicStudioProject({ title: "Massachusetts case study" })).toBe(true);
  });
});

describe("Phase 01 public project actions", () => {
  it("suppresses known unrelated and inaccessible destinations", () => {
    expect(studioProjectLink("https://budi-six.vercel.app/")).toBeUndefined();
    expect(studioProjectLink("https://github.com/budiabdallah20/Budi-s-")).toBeUndefined();
    expect(studioProjectLink("https://dental-system-beta-five.vercel.app/")).toBeUndefined();
    expect(studioProjectLink("https://raqibdev.vercel.app/")).toBe("https://raqibdev.vercel.app/");
  });
});
