import type { StudioService } from "@/data/studio-services";
import type { Lang } from "@/i18n/dictionaries";

type Step = readonly [label: string, detail: string];
type ServiceCopy = { process: readonly Step[]; projectType: string; projectRole: string; fallback: string; strength: readonly string[]; evidence?: string };

export const atelierServices: Record<StudioService["key"], Record<Lang, ServiceCopy>> = {
  build: {
    en: {
      process: [
        ["Scope", "Define the users, the critical journeys and the first release."],
        ["Build", "Develop the responsive interface, API and data flows together."],
        ["Launch", "Validate the main journeys, configure deployment and hand over the product."],
      ],
      projectType: "Portfolio platform",
      projectRole: "Portfolio interface and application integration",
      strength: ["Core journeys checked at mobile and desktop widths", "Reusable components and documented deployment steps"],
      fallback: "Ask about a walkthrough of the interface, API and deployment approach for your product.",
    },
    fr: {
      process: [
        ["Cadrer", "Définir les utilisateurs, les parcours essentiels et la première version."],
        ["Développer", "Relier l’interface responsive, l’API et les flux de données."],
        ["Lancer", "Valider les parcours, configurer le déploiement et transmettre le produit."],
      ],
      projectType: "Plateforme portfolio",
      projectRole: "Interface du portfolio et intégration applicative",
      strength: ["Parcours essentiels vérifiés sur mobile et ordinateur", "Composants réutilisables et étapes de déploiement documentées"],
      fallback: "Demandons-nous comment relier l’interface, l’API et le déploiement de votre produit.",
    },
  },
  system: {
    en: {
      process: [
        ["Map", "Document roles, permissions and the handoffs between teams."],
        ["Architect", "Model the data and design the workflows and integrations."],
        ["Validate", "Walk through each role’s access and the cases where a workflow can fail."],
      ],
      projectType: "Academic operations system",
      projectRole: "Academic workflows and role-based access",
      strength: ["Permissions and data relationships mapped during scoping", "Access checks for every role before handoff"],
      fallback: "Ask how your roles, permissions and workflows could fit into one system.",
    },
    fr: {
      process: [
        ["Cartographier", "Documenter les rôles, les autorisations et les échanges entre équipes."],
        ["Concevoir", "Modéliser les données et concevoir les parcours et les intégrations."],
        ["Valider", "Vérifier les accès par rôle et les cas où un parcours peut échouer."],
      ],
      projectType: "Système de gestion académique",
      projectRole: "Processus académiques et accès par rôle",
      strength: ["Droits d’accès et relations de données définis dès le cadrage", "Vérification des accès pour chaque rôle avant la livraison"],
      fallback: "Voyons comment réunir vos rôles, vos autorisations et vos processus dans un même système.",
    },
  },
  care: {
    en: {
      process: [
        ["Inspect", "Reproduce the issue and review dependencies and application behavior."],
        ["Prioritize", "Agree on changes based on impact, risk and the effort to verify them."],
        ["Retest", "Check the affected journeys and record what changed and what still needs monitoring."],
      ],
      fallback: "A maintenance engagement starts with a review of your application. The handoff records the findings, the fixes and the checks used to verify them.",
      strength: ["Reproduction steps recorded before making changes", "Regression checks documented for future updates"],
      projectType: "Portfolio maintenance",
      projectRole: "Regression testing and maintenance",
      evidence: "BUDI Platform uses regression tests for security headers, rate limits and project availability, so changes to these behaviors can be checked before release.",
    },
    fr: {
      process: [
        ["Inspecter", "Reproduire le problème et examiner les dépendances et le comportement de l’application."],
        ["Prioriser", "Convenir des modifications selon leur impact, leur risque et l’effort de vérification."],
        ["Retester", "Vérifier les parcours concernés et documenter les changements et les points à surveiller."],
      ],
      fallback: "La maintenance commence par une revue de votre application. Le compte rendu rassemble les constats, les correctifs et les vérifications effectuées.",
      strength: ["Étapes de reproduction documentées avant la correction", "Tests de régression documentés pour les mises à jour"],
      projectType: "Maintenance du portfolio",
      projectRole: "Tests de régression et maintenance",
      evidence: "BUDI Platform utilise des tests de régression pour les en-têtes de sécurité, les limites de requêtes et la disponibilité des projets avant la mise en ligne.",
    },
  },
};

export const atelierSkillRoles: Record<string, Record<Lang, string>> = {
  next: { en: "Routing, rendering and application performance.", fr: "Routage, rendu et performances de l’application." },
  react: { en: "Reusable interface components and interaction state.", fr: "Composants d’interface réutilisables et états interactifs." },
  typescript: { en: "Typed contracts between the UI, server and data.", fr: "Contrats typés entre l’interface, le serveur et les données." },
  node: { en: "Server-side workflows and integrations.", fr: "Processus côté serveur et intégrations." },
  postgresql: { en: "Relational data models and constraints.", fr: "Modèles de données relationnels et contraintes." },
  prisma: { en: "Data access and schema migrations.", fr: "Accès aux données et migrations de schéma." },
  "git-github": { en: "Traceable fixes and change review.", fr: "Traçabilité des corrections et revue des changements." },
  javascript: { en: "Diagnosing browser behavior and client-side issues.", fr: "Diagnostic du comportement du navigateur et des problèmes côté client." },
};
