"use client";

import { useId, useState } from "react";
import TechnologyIcon from "@/components/TechnologyIcon";
import { ArrowUpRight } from "lucide-react";
import EngravedPath from "./EngravedPath";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Relic = { key: string; name: string; category?: string; logo?: string };

/** Original ornamental forms, not replicas or historical inscriptions. */
function RelicObject({ variant }: { variant: number }) {
  const id = useId().replaceAll(":", "");
  const silhouettes = [
    "M68 29Q100 5 132 29L141 151Q100 175 59 151Z", // cartouche
    "M100 8 126 42 140 166H60L74 42Z", // obelisk
    "M83 41Q100 24 117 41L124 64 176 35 168 85 137 122 115 143 100 158 85 143 63 122 32 85 24 35 76 64Z", // winged scarab
    "M52 30H148L160 151 100 172 40 151Z", // votive tablet
  ];
  return <svg className={`relic-object relic-object--${variant}`} viewBox="0 0 200 200" aria-hidden="true" fill="none">
    <defs><linearGradient id={id} x1="30" y1="20" x2="175" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#8B651C"/><stop offset=".22" stopColor="#F6D889"/><stop offset=".38" stopColor="#E4B94F"/><stop offset=".57" stopColor="#7d5b20"/><stop offset=".8" stopColor="#d7ac4f"/><stop offset="1" stopColor="#684b1c"/></linearGradient></defs>
    <path d={silhouettes[variant]} fill={`url(#${id})`} stroke="#F6D889" strokeWidth="1.2" />
    <path d={silhouettes[variant]} transform="translate(10 10) scale(.9)" stroke="#302615" strokeWidth="1.2" />
    <path d="M73 139h54m-47 6h40M89 27h22M95 21h10" stroke="#fff0b7" opacity=".6"/>
    {variant === 2 && <path d="m49 54 24 23m-28-6 24 19m-16 4 19 12m79-52-24 23m28-6-24 19m16 4-19 12M100 146v-19" stroke="#624415" strokeWidth="2"/>}
    <path d="M47 176h106l15 10H32z" fill="#3c3528" stroke="#ac8b4d"/><path d="M32 186h136v7H32z" fill="#141616" stroke="#67594A"/>
  </svg>;
}

export default function SkillRelics<T extends Relic>({ items, label, onOpen, colorFor }: {
  items: T[]; label: string; onOpen: (item: T) => void; colorFor: (name: string) => string;
}) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const active = hovered ?? selected;
  const color = colorFor(items.find(item => item.key === active)?.name ?? "");
  return <>
    {selected && <div className="exhibit-selection"><span>{items.find(item => item.key === selected)?.name}</span><button type="button" onClick={() => setSelected(null)}>{t.exhibition.reset} ×</button></div>}
    <EngravedPath className="relic-field" activeKey={active} color={color}>
    {items.map((item, i) => <article className={`relic-shell${active === item.key ? " is-active" : ""}`} key={item.key} data-exhibit-key={item.key} style={{ "--skill-color": colorFor(item.name) } as React.CSSProperties}>
      <button type="button" className="relic-trigger" aria-label={`${label}: ${item.name}`} aria-haspopup="dialog"
        onPointerEnter={() => setHovered(item.key)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(item.key)} onBlur={() => setHovered(null)} onClick={() => { setSelected(item.key); onOpen(item); }}>
        <span className="relic-spotlight" aria-hidden="true" />
        <span className="relic-stage"><RelicObject variant={i % 4}/><span className="relic-brand"><TechnologyIcon name={item.name} src={item.logo}/></span></span>
        <span className="relic-label"><small>{String(i + 1).padStart(2, "0")} / {item.category}</small><strong>{item.name}</strong><span>{label}<ArrowUpRight size={13}/></span></span>
      </button>
    </article>)}
  </EngravedPath></>;
}
