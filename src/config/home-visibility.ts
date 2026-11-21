const optionalSections = ["about", "projects", "skills", "certificates", "contact", "footer"] as const;
type OptionalSection = (typeof optionalSections)[number];

export type HomeVisibility = Record<OptionalSection, boolean>;

export function getHomeVisibility(sections: string | string[] | undefined): HomeVisibility {
  const requested = new Set([sections ?? []].flat().flatMap(value => value.split(",")));
  const all = process.env.NODE_ENV !== "development" || requested.has("all");
  return {
    about: true,
    projects: true,
    skills: all || requested.has("skills"),
    certificates: all || requested.has("certificates"),
    contact: all || requested.has("contact"),
    footer: all || requested.has("footer"),
  };
}

export function homeSectionHref(
  href: string,
  visibility?: HomeVisibility,
  section = optionalSections.find(key => href === `#${key}`),
): string {
  return section && visibility?.[section] === false ? `?sections=all${href}` : href;
}

export function isHomeAnchorVisible(href: string, visibility?: HomeVisibility): boolean {
  return homeSectionHref(href, visibility) === href;
}
