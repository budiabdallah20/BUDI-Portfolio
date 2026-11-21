import { serviceIdentities } from "./service-identities";

export const studioServices = [
  {
    key: "build", shot: "01", image: "/images/services/exhibit-web.webp",
    projectId: "budi-portfolio", skillIds: ["next", "react", "typescript"],
    en: {
      label: "BUILD", name: serviceIdentities.build.en,
      value: "Launch a complete web product.",
      description: "Turn your idea into a responsive app, with the interface, API and data working together.",
      points: ["Responsive websites and web apps", "API, data and authentication integration", "Deployment setup and handoff"],
      action: "Discuss a project",
    },
    fr: {
      label: "CRÉER", name: serviceIdentities.build.fr,
      value: "Lancez un produit web complet.",
      description: "Transformez votre idée en application responsive en reliant l’interface, l’API et les données.",
      points: ["Sites et applications web responsives", "Intégration des API, données et accès", "Mise en ligne et passation"],
      action: "Parler de votre projet",
    },
  },
  {
    key: "system", shot: "02", image: "/images/services/studio-systems.webp",
    projectId: "raqib", skillIds: ["typescript", "node", "postgresql", "prisma"],
    en: {
      label: "ENGINEER", name: serviceIdentities.system.en,
      value: "Give your team one reliable workflow.",
      description: "Bring scattered tools and manual steps into one system built around the way your team works.",
      points: ["Role-based workflows", "Data modeling and permissions", "Integrations and workflow automation"],
      action: "Discuss your system",
    },
    fr: {
      label: "CONCEVOIR", name: serviceIdentities.system.fr,
      value: "Unifiez le travail de votre équipe.",
      description: "Regroupez vos outils et vos tâches manuelles dans un système adapté au fonctionnement de votre équipe.",
      points: ["Parcours adaptés aux rôles", "Modélisation des données et droits d’accès", "Intégrations et automatisation des tâches"],
      action: "Parler de votre système",
    },
  },
  {
    key: "care", shot: "03", image: "/images/services/studio-care.webp",
    projectId: "budi-portfolio", skillIds: ["next", "git-github", "javascript"],
    en: {
      label: "OPTIMIZE", name: serviceIdentities.care.en,
      value: "Keep your existing product dependable.",
      description: "Keep an existing site dependable as dependencies, browsers and business needs change.",
      points: ["Issue diagnosis and troubleshooting", "Maintenance and security review", "Performance optimization and upkeep"],
      action: "Ask about support",
    },
    fr: {
      label: "OPTIMISER", name: serviceIdentities.care.fr,
      value: "Préservez la fiabilité de votre produit.",
      description: "Gardez votre site fiable au fil des changements de dépendances, de navigateurs et de besoins.",
      points: ["Diagnostic et résolution des incidents", "Maintenance et revue de sécurité", "Optimisation des performances et suivi"],
      action: "Demander une assistance",
    },
  },
] as const;

export type StudioService = typeof studioServices[number];

export function studioServiceContactAnchor(key: StudioService["key"]): string {
  return "contact-service-" + key;
}

export function studioScopeContactAnchor(key: StudioService["key"]): string {
  return studioServiceContactAnchor(key) + "-scope";
}

export function studioScopeStorageKey(key: StudioService["key"]): string {
  return "budi-service-scope:" + key;
}

const servicePatterns = {
  build: /full.stack|business websites|sites web professionnels/i,
  system: /architecture|clinic management|gestion de cabinets|custom system|system development|développement de systèmes/i,
  care: /maintenance|technical support|assistance technique/i,
};

export function studioServiceMatches(key: keyof typeof servicePatterns, name: string): boolean {
  return servicePatterns[key].test(name);
}
