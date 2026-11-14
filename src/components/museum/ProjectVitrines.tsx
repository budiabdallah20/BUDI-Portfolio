"use client";
/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, Layers3 } from "lucide-react";
import { techLogo } from "@/data/techLogos";
import { useLanguage } from "@/components/providers/LanguageProvider";
import FeaturedGallery from "./FeaturedGallery";

type Project = { key: string; name: string; image?: string; gallery?: string[]; category?: string; description?: string; tags?: string[]; demo?: string; github?: string; status?: string; deadline?: string };
export default function ProjectVitrines<T extends Project>({ items, onOpen, labels }: {
  items: T[]; onOpen: (item: T) => void;
  labels: { explore: string; available: string; maintenance: string; progress: string; due: string; image: string };
}) {
  const { t } = useLanguage();
  return <FeaturedGallery className="featured-projects" label={labels.explore} names={items.map(item => item.name)}
    peek={i => items[i].image ? <img src={items[i].image} alt="" loading="lazy" /> : <Layers3 />}
    render={i => {
        const item = items[i];
        const preview = item.image === "/images/projects/raqib-wordmark.svg" ? item.image : item.gallery?.find(src => /\.(avif|webp|png|jpe?g)(\?|$)/i.test(src))
          || item.image;
        return <article className="vitrine">
        <button className="vitrine-inspect" type="button" aria-haspopup="dialog" aria-label={`${labels.explore}: ${item.name}`}
          onClick={() => onOpen(item)}>
          <span className="vitrine-cornice" aria-hidden="true"/><span className="vitrine-window">
            {preview ? <img src={preview} alt="" loading="lazy" width={640} height={400} onError={event => {
              const image = event.currentTarget;
              if (item.image && image.getAttribute("src") !== item.image) image.src = item.image;
              else image.hidden = true;
            }}/> : <span className="vitrine-missing"><Layers3 size={36}/>{labels.image}</span>}
            <span className="vitrine-glass" aria-hidden="true"/>
          </span>
          <span className="vitrine-title"><small>{String(i + 1).padStart(2, "0")} / {item.category}</small><strong>{item.name}</strong><span>{labels.explore}<ArrowUpRight size={14}/></span></span>
        </button>
        <div className="vitrine-label">
          {item.status && <span className={`museum-project-status museum-project-status--${item.status}`}>{item.status === "available" ? labels.available : item.status === "maintenance" ? labels.maintenance : labels.progress}</span>}
          {item.description && <p>{item.description}</p>}
          {!!item.tags?.length && <div className="museum-project-tags">{Array.from(new Set(item.tags)).map(tag => <span className="museum-project-tag" key={tag}>{techLogo(tag) && <img src={techLogo(tag)!} alt="" width={13} height={13} loading="lazy"/>}{tag}</span>)}</div>}
          {item.deadline && item.status !== "available" && <time dateTime={item.deadline}>{labels.due}: {item.deadline}</time>}
          <div className="vitrine-actions">{item.demo && <a href={item.demo} target="_blank" rel="noreferrer">{t.exhibition.live}<ArrowUpRight size={14}/></a>}{item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={14}/></a>}</div>
        </div><span className="vitrine-plinth" aria-hidden="true"/>
      </article>;
    }} />;
}
