"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { ArrowDownRight, ArrowUpRight, Download, FileText, Search, X } from "lucide-react";
import type { Lang } from "@/i18n/dictionaries";
import type { AdminCert } from "@/components/admin/store";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import "./creative-phase.css";

const copy = {
  en: {
    label: "Credentials", heading: ["Proof of", "learning"],
    design: "View design", studies: "Design studies", study: "Design study · not issued", published: "Gallery entries", empty: "No credentials published yet.", unavailable: "Credential records are temporarily unavailable.",
    noMatches: "No credentials match your search.", all: "All years", search: "Search credentials", details: "View credential",
    close: "Close credential", verify: "Open verification link", original: "Open original image", download: "Download credential",
    noImage: "Document preview unavailable", issuer: "Issuer", date: "Issued", reference: "Credential ID", expiry: "Expiry",
    skills: "Related skills", more: "Show more", viewSkills: "Explore skills",
  },
  fr: {
    label: "Certifications", heading: ["Parcours et", "certifications"],
    design: "Voir le design", studies: "Études de design", study: "Étude de design · non délivrée", published: "Entrées de la galerie", empty: "Aucune certification publiée pour le moment.", unavailable: "Les certifications sont temporairement indisponibles.",
    noMatches: "Aucune certification ne correspond à votre recherche.", all: "Toutes les années", search: "Rechercher une certification", details: "Voir la certification",
    close: "Fermer la certification", verify: "Ouvrir le lien de vérification", original: "Ouvrir l’image originale", download: "Télécharger le document",
    noImage: "Aperçu du document indisponible", issuer: "Organisme", date: "Délivrée", reference: "Identifiant", expiry: "Expiration",
    skills: "Compétences associées", more: "Afficher plus", viewSkills: "Explorer les compétences",
  },
} as const;

const PAGE_SIZE = 6;
// Published study rows store the same SVGs as these local originals.
const bundledStudies = new Set(["study-english", "study-microsoft", "study-cyber", "study-network"]);
const publicUrl = (value?: string) => value?.match(/^(?:\/(?![\\/])|https?:\/\/)/i) ? value : undefined;
const imageSource = (value?: string) => publicUrl(value) || (value?.match(/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,/i) ? value : undefined);

function formatDate(value: string | undefined, lang: Lang) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(date)
    : undefined;
}

function CredentialImage({ source, title, fallback, large }: { source?: string; title: string; fallback: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="creative-credential-media" data-large={large}>
      {source && !failed
        ? <Image src={source} alt={title} fill sizes={large ? "(max-width: 680px) 88vw, 660px" : "(max-width: 620px) 88vw, 390px"}
            unoptimized={!source.startsWith("/")} onError={() => setFailed(true)} />
        : <span><FileText aria-hidden="true" size={30} />{fallback}</span>}
    </div>
  );
}

function CredentialCard({ cert, index, lang, study = false }: { cert: AdminCert; index: number; lang: Lang; study?: boolean }) {
  const words = copy[lang];
  const title = (lang === "fr" ? cert.titleFr : cert.titleEn) || cert.titleEn || cert.titleFr;
  const issuer = (lang === "fr" ? cert.issuerFr : cert.issuerEn) || cert.issuerEn || cert.issuerFr;
  const issue = formatDate(cert.issueDate, lang) || (/^\d{4}$/.test(cert.year) ? cert.year : undefined);
  const expiry = formatDate(cert.expiry, lang);
  const file = publicUrl(cert.pdf) || imageSource(cert.pdf) || (cert.pdf?.startsWith("data:application/pdf;base64,") ? cert.pdf : undefined);
  const bundledStudy = study && bundledStudies.has(cert.id) && cert.image?.startsWith("data:image/svg+xml;base64,")
    ? "/images/certificates/" + cert.id + ".svg"
    : undefined;
  const media = imageSource(cert.image) || bundledStudy || (cert.pdf?.match(/\.(?:png|jpe?g|webp|avif)(?:[?#]|$)|^data:image\//i) ? imageSource(cert.pdf) : undefined);
  const issuerLogo = imageSource(cert.verifyLogo);
  const verify = publicUrl(cert.verify);
  const skills = [...new Set([...(cert.linkedSkills ?? []), ...(cert.skills ?? [])].filter(Boolean))];
  const facts = study ? [] : [[words.issuer, issuer], [words.date, issue], [words.reference, cert.code], [words.expiry, expiry]];

  return (
    <article className="creative-credential-card creative-frame">
      <div className="creative-credential-bar"><span>{String(index + 1).padStart(2, "0")}</span>{issue && <span>{issue}</span>}</div>
      <CredentialImage key={media} source={media} title={title} fallback={words.noImage} />
      <div className="creative-credential-meta">
        {study ? <p className="creative-kicker">{words.study}</p> : issuer && <p className="creative-kicker">{issuerLogo && <Image src={issuerLogo} width={22} height={22} alt="" unoptimized={!issuerLogo.startsWith("/")} />}{issuer}</p>}
        <h3>{title}</h3>
        {!!skills.length && <p>{skills.slice(0, 3).join(" · ")}</p>}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button type="button" className="creative-cta" aria-label={`${study ? words.design : words.details} · ${title}`}>{study ? words.design : words.details}<ArrowUpRight aria-hidden="true" /></Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="creative-credential-overlay" />
            <Dialog.Content className="creative-credential-dialog creative-frame" aria-describedby={undefined}>
              <header>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Close asChild><button type="button" className="creative-close" aria-label={words.close}><X aria-hidden="true" size={20} /></button></Dialog.Close>
              </header>
              {study && <p className="creative-kicker credential-study-label">{words.study}</p>}
              <CredentialImage key={media} source={media} title={title} fallback={words.noImage} large />
              <dl className="creative-credential-facts">
                {facts.map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              {!!skills.length && <div className="creative-dossier-skills"><h4>{words.skills}</h4><p>{skills.join(" · ")}</p></div>}
              <div className="creative-dossier-actions">
                {!study && verify && <a className="creative-cta" href={verify} target="_blank" rel="noopener noreferrer">{words.verify}<ArrowUpRight size={15} aria-hidden="true" /></a>}
                {media && publicUrl(media) && <a href={media} target="_blank" rel="noopener noreferrer">{words.original}<ArrowUpRight size={15} aria-hidden="true" /></a>}
                {!study && (file || media) && <a href={file || media} download={`credential-${cert.id.replace(/[^\w-]/g, "-")}`} target="_blank" rel="noopener noreferrer">{words.download}<Download size={15} aria-hidden="true" /></a>}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </article>
  );
}

export default function Certificates({ remote }: { remote?: AdminCert[] }) {
  const { lang } = useLanguage();
  const words = copy[lang];
  const [year, setYear] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const credentials = (remote ?? []).filter(cert =>
    cert.visible !== false && !/^study-/i.test(cert.id) && Boolean(cert.titleEn?.trim() || cert.titleFr?.trim())
  ).sort((a, b) => Number(b.featured) - Number(a.featured) || (b.issueDate || b.year || "").localeCompare(a.issueDate || a.year || ""));
  const studies = (remote ?? []).filter(cert => cert.visible !== false && /^study-/i.test(cert.id));
  const years = [...new Set(credentials.map(cert => cert.year).filter(year => /^\d{4}$/.test(year)))].sort().reverse();
  const activeYear = years.includes(year) ? year : "";
  const search = query.trim().toLocaleLowerCase(lang);
  const filtered = credentials.filter(cert => (!activeYear || cert.year === activeYear) &&
    [cert.titleEn, cert.titleFr, cert.issuerEn, cert.issuerFr, ...(cert.skills ?? []), ...(cert.linkedSkills ?? [])]
      .some(text => text?.toLocaleLowerCase(lang).includes(search)));

  return (
    <section id="certificates" className="creative-section" aria-labelledby="certificates-heading">
      <div className="creative-wrap">
        <header className="creative-masthead">
          <div className="creative-kicker">{words.label}<ArrowDownRight size={18} aria-hidden="true" /></div>
          <div className="creative-masthead-row">
            <h2 id="certificates-heading">{words.heading[0]} <em>{words.heading[1]}</em></h2>
            <div className="credential-counts"><p className="creative-count"><strong>{remote ? (credentials.length + studies.length).toLocaleString(lang) : "—"}</strong>{words.published}</p></div>
          </div>
        </header>
        <div className="creative-exhibition creative-frame">
          {credentials.length >= 4 && (
            <div className="creative-credential-controls">
              {years.length > 1 && <select aria-label={words.all} value={activeYear} onChange={event => { setYear(event.target.value); setLimit(PAGE_SIZE); }}>
                <option value="">{words.all}</option>
                {years.map(value => <option key={value}>{value}</option>)}
              </select>}
              <label><Search size={16} aria-hidden="true" /><span className="sr-only">{words.search}</span>
                <input type="search" placeholder={words.search} value={query} onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }} />
              </label>
              <span role="status">{Math.min(filtered.length, limit)} / {filtered.length}</span>
            </div>
          )}
          {filtered.length
            ? <div className="creative-credential-grid">{filtered.slice(0, limit).map((cert, index) =>
                <CredentialCard key={cert.id} cert={cert} index={index} lang={lang} />
              )}</div>
            : !studies.length || !!credentials.length ? <div className="creative-credential-empty">
              <div className="creative-empty-icon" aria-hidden="true"><FileText size={32} strokeWidth={1.2} /></div>
              <p>{credentials.length ? words.noMatches : remote ? words.empty : words.unavailable}</p>
              {!credentials.length && <a href="?sections=all#skills">{words.viewSkills}<ArrowUpRight size={15} aria-hidden="true" /></a>}
            </div> : null}
          {filtered.length > limit && <Button type="button" className="creative-cta creative-more" onClick={() => setLimit(limit + PAGE_SIZE)}>{words.more}</Button>}
          {!!studies.length && <div className="credential-study-shelf">
            <h3>{words.studies}</h3>
            <div className="creative-credential-grid">{studies.map((cert, index) =>
              <CredentialCard key={cert.id} cert={cert} index={index} lang={lang} study />
            )}</div>
          </div>}
        </div>
      </div>
    </section>
  );
}
