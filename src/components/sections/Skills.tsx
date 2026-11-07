"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, Heart, Plus, Search } from "lucide-react";
import GlassModal from "@/components/GlassModal";
import TechnologyIcon from "@/components/TechnologyIcon";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { AdminProject, AdminSkill } from "@/components/admin/store";
import { readSkillLiked, skillLikesKey } from "@/components/admin/store";
import { libIcon } from "@/lib/brandIcons";
import { skillProjectUsage } from "@/lib/skill-usage";
import { technologyHref, selectTechnology } from "@/lib/project-filter";
import { museumSkillAllowed } from "@/lib/museum-content";
type Category = "all" | "frontend" | "backend" | "tools" | "life";
type ProofKey = "daily" | "portfolio" | "client" | "learning";
type LevelKey = "expert" | "advanced" | "intermediate";

interface Skill {
  name: string;
  cat: Exclude<Category, "all">;
  level: number;
  levelKey: LevelKey;
  proof: ProofKey;
  logo: string;
  /** Library icon key — renders instead of the logo when set. */
  icon?: string;
  detail: { en: string; fr: string };
  years?: number;
  featured?: boolean;
  learningNow?: boolean;
  order?: number;
}


export const SKILLS: Skill[] = [
  { name: "React", cat: "frontend", level: 92, levelKey: "expert", proof: "daily", logo: "/icons/tech/react.svg", detail: { en: "Component architecture, hooks and state done right.", fr: "Architecture composants, hooks et state maîtrisés." } },
  { name: "Next.js", cat: "frontend", level: 90, levelKey: "expert", proof: "portfolio", logo: "/icons/tech/nextjs.svg", detail: { en: "App Router, SSR and SEO-friendly builds.", fr: "App Router, SSR et builds SEO-friendly." } },
  { name: "TypeScript", cat: "frontend", level: 86, levelKey: "expert", proof: "daily", logo: "/icons/tech/typescript.svg", detail: { en: "Strict types from API to UI.", fr: "Types stricts, de l'API à l'UI." } },
  { name: "JavaScript", cat: "frontend", level: 88, levelKey: "expert", proof: "daily", logo: "/icons/tech/javascript.svg", detail: { en: "Modern ES, async patterns, clean logic.", fr: "ES moderne, async et logique propre." } },
  { name: "Tailwind CSS", cat: "frontend", level: 90, levelKey: "expert", proof: "portfolio", logo: "/icons/tech/tailwind.svg", detail: { en: "Design systems at utility speed.", fr: "Design systems à vitesse utilitaire." } },
  { name: "HTML", cat: "frontend", level: 95, levelKey: "expert", proof: "daily", logo: "/icons/tech/html.svg", detail: { en: "Semantic, accessible markup.", fr: "Markup sémantique et accessible." } },
  { name: "CSS", cat: "frontend", level: 90, levelKey: "expert", proof: "daily", logo: "/icons/tech/css.svg", detail: { en: "Layouts, animations and polish.", fr: "Layouts, animations et finition." } },
  { name: "GSAP", cat: "frontend", level: 76, levelKey: "advanced", proof: "portfolio", logo: "/icons/tech/gsap.svg", detail: { en: "Scroll choreography that wows.", fr: "Chorégraphies scroll qui impressionnent." } },
  { name: "Framer Motion", cat: "frontend", level: 78, levelKey: "advanced", proof: "portfolio", logo: "/icons/tech/framer.svg", detail: { en: "Buttery UI physics and gestures.", fr: "Physique UI fluide et gestes." } },
  { name: "Node.js", cat: "backend", level: 72, levelKey: "advanced", proof: "client", logo: "/icons/tech/nodejs.svg", detail: { en: "APIs and tooling behind the scenes.", fr: "API et outillage en coulisses." } },
  { name: "Git & GitHub", cat: "tools", level: 84, levelKey: "advanced", proof: "daily", logo: "/icons/tech/git.svg", detail: { en: "Clean history, reviews, CI basics.", fr: "Historique propre, reviews et CI." } },
  { name: "Figma", cat: "tools", level: 68, levelKey: "intermediate", proof: "learning", logo: "/icons/tech/figma.svg", detail: { en: "From mockup to pixel-faithful code.", fr: "De la maquette au code fidèle." } },
];

export default function Skills({ remote, projects }: { remote?: AdminSkill[]; projects?: AdminProject[] }): React.JSX.Element {
 const { lang, t } = useLanguage();
 const fr = lang === "fr";
 const [category, setCategory] = useState("all");
 const [query, setQuery] = useState("");
 const [limit, setLimit] = useState(12);
 const [az, setAZ] = useState(false);
 const [liked, setLiked] = useState<Record<string, boolean>>({});
 const [detail, setDetail] = useState<string | null>(null);
 const [copied, setCopied] = useState(false);
 useEffect(() => { setLiked(readSkillLiked()); }, []);
 const list = useMemo(() => (remote === undefined ? SKILLS : remote.filter(s => s.visible !== false).map(s => ({ ...s, detail: { en: s.detailEn, fr: s.detailFr } }))).filter(museumSkillAllowed), [remote]);
 const refs = projects === undefined ? t.projects.items : projects;
 const usage = new Map(list.map(s => [s.name, skillProjectUsage(s.name, s.level, refs)]));
 const filtered = list.filter(s => (category === "all" || category === s.cat) && s.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => az ? a.name.localeCompare(b.name) : (a.order || 9999) - (b.order || 9999) || Number(!!b.featured) - Number(!!a.featured) || a.name.localeCompare(b.name));
 const selected = list.find(s => s.name === detail);
 const labels: Record<string,string> = { all: fr ? "Tout" : "All skills", frontend: "Frontend", backend: "Backend", tools: fr ? "Outils & design" : "Tools & design" };
 const like = (name: string): void => {
   const next = { ...liked, [name]: !liked[name] }; setLiked(next);
   try { localStorage.setItem(skillLikesKey(), JSON.stringify(next)); } catch { /* Session state remains usable. */ }
 };
 const projectLink = (name: string): React.JSX.Element => <a href={technologyHref(name)} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setDetail(null); selectTechnology(name); }} className="evolution-action">{fr ? "Voir les projets" : "View projects"}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>;
 return <section id="skills" aria-labelledby="skills-heading" className="evolution-section border-t border-border">
  <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
   <div className="evolution-heading"><div><p className="eyebrow">04 / {fr ? "Technologies" : "The toolkit"}</p><h2 id="skills-heading" className="display mt-4 text-4xl font-bold sm:text-6xl">{fr ? "La pratique, en preuve." : "Craft, backed by work."}</h2></div><p className="max-w-sm text-muted">{fr ? "Explorez les technologies et les projets dans lesquels elles sont utilisées." : "Technical tools and everyday strengths, connected by practice. Explore the projects behind each technology."}</p></div>
   <div className="evolution-toolbar">
    <div role="group" aria-label={fr ? "Catégories" : "Skill categories"} className="flex flex-wrap gap-2">{Object.entries(labels).map(([id,label]) => <button key={id} type="button" aria-pressed={category === id} onClick={() => { setCategory(id); setLimit(12); }} className="evolution-filter">{label}<span className="ms-2 opacity-60">{id === "all" ? list.length : list.filter(s => s.cat === id).length}</span></button>)}</div>
    <label className="evolution-search"><Search aria-hidden="true" className="h-4 w-4"/><span className="sr-only">{fr ? "Rechercher une technologie" : "Search technologies"}</span><input value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} placeholder={fr ? "Rechercher…" : "Find a technology…"}/></label>
   </div>
   <div className="my-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><p role="status">{Math.min(limit,filtered.length)} / {filtered.length} {fr ? "technologies" : "technologies"}</p><div className="flex gap-3"><button type="button" aria-pressed={az} onClick={() => setAZ(!az)} className="evolution-action">A–Z</button><button type="button" className="evolution-action" onClick={async () => { try { await navigator.clipboard.writeText(list.map(s => s.name).join(", ")); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}{fr ? "Copier la stack" : "Copy stack"}</button></div></div>
   <div className="skill-glass-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{filtered.slice(0,limit).map(s => {
    const Icon = libIcon(s.icon); const count = usage.get(s.name)?.count ?? 0;
    return <article key={s.name} className="evolution-skill"><span className="skill-wire-h" aria-hidden="true"/><span className="skill-wire-v" aria-hidden="true"/><div className="flex items-start justify-between gap-3"><span className="evolution-tech-icon">{Icon ? <Icon className="h-7 w-7" aria-hidden="true"/> : <TechnologyIcon name={s.name} src={s.logo}/>}</span><button type="button" onClick={() => like(s.name)} aria-label={(fr ? "Aimer : " : "Like: ") + s.name} aria-pressed={!!liked[s.name]} className="skill-like flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted"><Heart aria-hidden="true" className="h-4 w-4" fill={liked[s.name] ? "currentColor" : "none"}/></button></div><p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-faint">{labels[s.cat] ?? s.cat}</p><h3 className="mt-1 text-xl font-bold"><button type="button" aria-haspopup="dialog" onClick={() => setDetail(s.name)}>{s.name}</button></h3><p className="mt-3 text-sm text-muted">{s.cat === "life" ? (fr ? "Au quotidien" : "Everyday practice") : <>{fr ? "Utilisée dans " : "Used in "}<strong className="text-foreground">{count}</strong>{fr ? " projet(s)" : count === 1 ? " project" : " projects"}</>}</p><div className="mt-5 border-t border-border pt-4">{s.cat === "life" ? <button className="evolution-action" type="button" onClick={()=>setDetail(s.name)}>{fr ? "En savoir plus" : "Explore skill"}</button> : projectLink(s.name)}</div></article>;
   })}</div>
   {filtered.length === 0 && <div className="evolution-empty"><p>{fr ? "Aucune technologie trouvée." : "No matching technologies."}</p><button type="button" className="evolution-action" onClick={() => { setQuery(""); setCategory("all"); }}>{fr ? "Réinitialiser" : "Reset filters"}</button></div>}
   {limit < filtered.length && <button type="button" className="evolution-action mx-auto mt-8" onClick={() => setLimit(limit + 12)}><Plus className="h-4 w-4"/>{fr ? "Voir plus" : "Show more"}</button>}
   <GlassModal open={!!selected} onClose={() => setDetail(null)} label={selected?.name ?? "Technology"}>{selected && <div><p className="eyebrow">{labels[selected.cat]}</p><h3 className="mt-3 text-3xl font-bold text-white">{selected.name}</h3><p className="my-5 text-white/70">{fr ? selected.detail.fr : selected.detail.en}</p><p className="mb-5 text-white/70">{selected.cat === "life" ? (fr ? "Une pratique personnelle au quotidien." : "A personal skill practised in everyday life.") : usage.get(selected.name)?.projects.join(" · ") || (fr ? "Aucun projet publié avec cette technologie." : "No published projects use this technology yet.")}</p>{selected.cat !== "life" && projectLink(selected.name)}</div>}</GlassModal>
  </div>
 </section>;
}
