import type { AdminProject } from "@/components/admin/store";

export type ProjectAvailability = "available" | "maintenance" | "in-progress";
const maintenanceTag = "@budi:maintenance";
const deadlinePrefix = "@budi:due:";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function projectPublicTags(tags: readonly string[] | undefined): string[] {
  return (tags ?? []).filter(tag => tag !== maintenanceTag && !tag.startsWith(deadlinePrefix));
}

export function getProjectAvailability(project: Pick<AdminProject, "status" | "tags">): { state: ProjectAvailability; deadline: string } {
  const tags = project.tags ?? [];
  const due = tags.find(tag => tag.startsWith(deadlinePrefix))?.slice(deadlinePrefix.length) ?? "";
  return {
    state: tags.includes(maintenanceTag) ? "maintenance" : project.status === "completed" ? "available" : "in-progress",
    deadline: datePattern.test(due) ? due : "",
  };
}

export function setProjectAvailability<T extends Pick<AdminProject, "status" | "tags">>(project: T, state: ProjectAvailability, deadline: string): T {
  const tags = projectPublicTags(project.tags);
  if (state === "maintenance") tags.push(maintenanceTag);
  if (datePattern.test(deadline)) tags.push(`${deadlinePrefix}${deadline}`);
  return { ...project, status: state === "in-progress" ? "in-progress" : "completed", tags };
}

export function setProjectPublicTags<T extends Pick<AdminProject, "status" | "tags">>(project: T, tags: string[]): T {
  const { state, deadline } = getProjectAvailability(project);
  return setProjectAvailability({ ...project, tags }, state, deadline);
}
