import type { Lang } from "@/i18n/dictionaries";
import type { serviceIdentities } from "@/data/service-identities";

type ServiceKey = keyof typeof serviceIdentities;

export const scales = {
  prototype: { en: "MVP / Prototype", fr: "MVP / Prototype", range: [2, 3] },
  saas: { en: "Full SaaS product", fr: "Produit SaaS complet", range: [4, 6] },
  enterprise: { en: "Enterprise system", fr: "Système d’entreprise", range: [8, 12] },
} as const;

export const modules = {
  auth: { en: "Auth & RBAC", fr: "Authentification et rôles", effort: 1, stack: ["Auth.js", "PostgreSQL"] },
  admin: { en: "Admin dashboard", fr: "Tableau de bord admin", effort: 1, stack: ["React", "TypeScript"] },
  ai: { en: "AI / LLM integration", fr: "Intégration IA / LLM", effort: 2, stack: ["Server-side provider API"] },
  billing: { en: "Payments & billing", fr: "Paiements et facturation", effort: 2, stack: ["Payment provider", "Webhooks"] },
  spatial: { en: "3D / motion UI", fr: "Interface 3D / animation", effort: 1, stack: ["Three.js", "GSAP"] },
  live: { en: "Real-time sync", fr: "Synchronisation en direct", effort: 1, stack: ["Realtime transport", "PostgreSQL"] },
} as const;

export type Scale = keyof typeof scales;
export type ScopeModule = keyof typeof modules;
export type Scope = { scale: Scale; modules: ScopeModule[] };

export const serviceBlueprints = {
  build: ["Next.js", "TypeScript"],
  system: ["TypeScript", "Node.js", "PostgreSQL"],
  care: ["Browser DevTools", "Git", "Regression tests"],
} as const;

export function estimateScope(service: ServiceKey, scope: Scope) {
  const [lower, upper] = scales[scope.scale].range;
  const effort = scope.modules.reduce((sum, key) => sum + modules[key].effort, 0);
  const stack = Array.from(new Set([...serviceBlueprints[service], ...scope.modules.flatMap(key => modules[key].stack)]));
  return { lower: lower + Math.ceil(effort / 2), upper: upper + effort, stack };
}

export function scopeSummary(title: string, service: ServiceKey, scope: Scope, lang: Lang) {
  const result = estimateScope(service, scope);
  const fr = lang === "fr";
  return [
    title,
    (fr ? "Périmètre" : "Scope") + " — " + scales[scope.scale][lang],
    (fr ? "Modules" : "Modules") + " — " + (scope.modules.map(key => modules[key][lang]).join(", ") || (fr ? "aucun ajout" : "no add-ons")),
    (fr ? "Estimation indicative" : "Planning estimate") + ` — ${result.lower}–${result.upper} ${fr ? "semaines" : "weeks"}`,
    (fr ? "Pistes techniques" : "Architecture options") + " — " + result.stack.join(", "),
  ].join("\n");
}

export const compareRows = {
  en: [
    ["Best fit", "Launching a new product", "Scaling team workflows", "Fixing and speeding up software"],
    ["Delivery approach", "First usable release", "Phased by role and workflow", "Prioritized fixes after diagnosis"],
    ["Architecture", "UI, API and data", "Permissions, data model and integrations", "Existing stack and dependencies"],
    ["Support terms", "Agreed at handoff", "Agreed after system discovery", "Agreed after the initial review"],
  ],
  fr: [
    ["Cas idéal", "Lancer un nouveau produit", "Structurer le travail d’une équipe", "Corriger et accélérer un logiciel"],
    ["Mode de livraison", "Première version utilisable", "Par étapes, selon les rôles", "Correctifs priorisés après diagnostic"],
    ["Architecture", "Interface, API et données", "Droits, données et intégrations", "Pile et dépendances existantes"],
    ["Conditions de suivi", "Définies à la livraison", "Définies après le cadrage", "Définies après la revue initiale"],
  ],
} as const;

export const comparisons = {
  build: { en: "Launching a new idea", fr: "Lancer une idée" },
  system: { en: "Scaling a team", fr: "Faire grandir une équipe" },
  care: { en: "Fixing & speeding up", fr: "Corriger et accélérer" },
} as const;
