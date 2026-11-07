import type { AdminService, AdminSkill } from "@/components/admin/store";

const retired = /(?:microsoft\s*)?(?:excel|power\s*point|powerpoint)|(?:إكسيل|اكسيل|باور\s*بوينت)/i;

export function museumSkillAllowed(skill: Pick<AdminSkill, "name" | "cat">): boolean {
  return skill.cat !== "life" && !retired.test(skill.name);
}

export function museumServiceAllowed(service: Pick<AdminService, "title" | "titleFr">): boolean {
  return !retired.test(service.title) && !retired.test(service.titleFr);
}
