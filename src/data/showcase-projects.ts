import { projectCoverFor } from "@/data/project-covers";
import { getProjectAvailability } from "@/lib/project-availability";
import { isPublicStudioProject, isRaqibProject, studioProjectHighlights, studioProjectLink } from "@/lib/studio-projects";
import { dictionaries, type Lang } from "@/i18n/dictionaries";
import type { RemoteContent } from "@/lib/content";

const frenchCategories = new Map([
  ["Education", "Éducation"],
  ["Personal", "Personnel"],
  ["Healthcare SaaS", "SaaS médical"],
]);

export function showcaseProjects(content: RemoteContent | null, lang: Lang) {
  const fr = lang === "fr";
  const rows: (RemoteContent["projects"][number] | (typeof dictionaries)["en"]["projects"]["items"][number])[] = content ? content.projects.filter(isPublicStudioProject).sort((a,b) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || Number(b.featured) - Number(a.featured))
    : dictionaries[lang].projects.items.filter(isPublicStudioProject);
  return rows.map(project => {
    const remote = "id" in project ? project : undefined;
    const key = remote?.id ?? project.github ?? project.title;
    const title = fr && remote?.titleFr ? remote.titleFr : project.title;
    const raqib = isRaqibProject({ key, github:project.github, name:title });
    const budi = key === "proj-budi-s" || /\/budi-s-\/?$/i.test(project.github);
    const rawDemo = studioProjectLink(remote?.demo) || (raqib ? "https://raqibdev.vercel.app/" : undefined);
    const legacyLikeId = project.github || project.title;
    const likeId = content && Object.hasOwn(content.likes, key) && !Object.hasOwn(content.likes, legacyLikeId)
      ? key : (project.github || remote?.id || project.title);
    const availability = remote ? getProjectAvailability(remote) : { state:project.status === "completed" ? "available" : "in-progress", deadline:undefined };
    return {
      key, likeId, title, raqib, budi, featured:remote?.featured === true,
      category:fr ? frenchCategories.get(project.category) ?? project.category : project.category, year:project.year,
      summary:fr && remote?.descFr ? remote.descFr : project.desc,
      tech:project.tech,
      points:(fr && remote?.briefFr?.length ? remote.briefFr : remote?.briefEn)?.length
        ? (fr && remote?.briefFr?.length ? remote.briefFr : remote?.briefEn) : studioProjectHighlights(project.github,lang),
      role:fr ? remote?.roleFr || remote?.roleEn : remote?.roleEn,
      timeline:fr ? remote?.timelineFr || remote?.timelineEn : remote?.timelineEn,
      impact:fr ? remote?.impactFr || remote?.impactEn : remote?.impactEn,
      gallery:remote?.gallery ?? [],
      cover:remote?.image || projectCoverFor(project.github),
      repo:studioProjectLink(project.github), demo:rawDemo,
      status:availability.state, deadline:availability.deadline,
      likes:content && remote ? content.likes[likeId] ?? content.likes[key] ?? 0 : undefined,
    };
  });
}


export const projectAnchor = (key: string) => "work-" + encodeURIComponent(key).replaceAll("%", "_");

export function projectSlug(project: ReturnType<typeof showcaseProjects>[number]): string {
  if (project.budi) return "budi-portfolio";
  if (project.raqib) return "raqib";
  const match = /^https?:\/\/[^/]+\/(?:[^/]+\/)*([^/?#]+)\/?$/i.exec(project.key);
  return (match?.[1] ?? project.key).normalize("NFC");
}
