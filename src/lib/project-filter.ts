import { canonicalTechnology } from "./skill-usage";
export function technologyHref(name: string): string { return "?technology=" + encodeURIComponent(canonicalTechnology(name)) + "#projects"; }
export function selectTechnology(name: string): void {
 const url = new URL(window.location.href);
 if (name) url.searchParams.set("technology", canonicalTechnology(name)); else url.searchParams.delete("technology");
 url.hash = "projects";
 window.history.pushState(window.history.state, "", url);
 window.dispatchEvent(new Event("budi:technology"));
 requestAnimationFrame(() => { const heading = document.getElementById("projects-heading"); heading?.setAttribute("tabindex", "-1"); heading?.focus({ preventScroll: true }); document.getElementById("projects")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); });
}
