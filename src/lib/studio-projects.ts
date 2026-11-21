/** Exclude retired projects from public presentation while retaining CMS records. */
export function isPublicStudioProject(project: {
  id?: string;
  title: string;
  titleFr?: string;
  github?: string;
  demo?: string;
  visible?: boolean;
}): boolean {
  if (project.visible === false) return false;
  const retiredName = /(?:^|[^\p{L}\p{N}])(?:massar|مسار)(?=$|[^\p{L}\p{N}])/iu;
  return ![project.id, project.title, project.titleFr, project.github, project.demo].some(value => value && retiredName.test(value));
}

export function isRaqibProject(project: { key: string; github?: string; name: string }): boolean {
  return /(?:^|[\s/\-_])raqi(?:b|eeb)(?:$|[\s/\-_])/i.test([project.key, project.github, project.name].join(" "));
}

const documentedHighlights = {
  raqib: {
    en: ["Student, professor and administrator access", "Attendance and lecture workflows", "Scheduling and grade management"],
    fr: ["Accès étudiant, enseignant et administrateur", "Suivi des présences et des cours", "Planification et gestion des notes"],
  },
  "budi-s-": {
    en: ["Portfolio and contact hub", "Donation methods", "Live dashboards"],
    fr: ["Portfolio et espace de contact", "Moyens de contribution", "Tableaux de bord en direct"],
  },
  "dental-system": {
    en: ["Online patient booking", "Patient and appointment administration", "Billing and practice workflows"],
    fr: ["Prise de rendez-vous en ligne", "Gestion des patients et rendez-vous", "Facturation et gestion du cabinet"],
  },
} satisfies Record<string, Record<"en" | "fr", string[]>>;

export function studioProjectHighlights(repository: string | undefined, lang: "en" | "fr"): string[] | undefined {
  const slug = repository?.split(/[/?#]/).filter(Boolean).at(-1)?.toLowerCase();
  if (!slug || !Object.hasOwn(documentedHighlights, slug)) return undefined;
  return documentedHighlights[slug as keyof typeof documentedHighlights][lang];
}

/** Keep persisted URLs available to admin while excluding known dead or placeholder actions. */
export function studioProjectLink(repository?: string): string | undefined {
  const url = repository?.replace(/\/$/, "").toLowerCase();
  if (url === "https://github.com/budiabdallah20/budi-s-" || url === "https://dental-system-beta-five.vercel.app" || url === "https://budi-six.vercel.app") return undefined;
  return repository;
}
