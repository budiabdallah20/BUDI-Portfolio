"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Copy, Quote } from "lucide-react";
import type { Lang } from "@/i18n/dictionaries";
import { railDateSuffix, type SitePayments } from "@/components/WorkStatus";
import { socialLinks } from "@/data/portfolio";
import "./creative-phase.css";

const contact = {
  en: {
    label:"Contact", hero:"Make the first move",
    slogan:"No risk. No story.",
    voice:"Mohamed Abdallah", email:"Email me", whatsapp:"Chat on WhatsApp", copy:"Copy email",
    copied:"Email copied.", failed:"Copy unavailable.", selected:"Selected service",
  },
  fr: {
    label:"Contact", hero:"Faisons le premier pas",
    slogan:"Sans risque, pas d’histoire.",
    voice:"Mohamed Abdallah", email:"M’écrire", whatsapp:"Écrire sur WhatsApp", copy:"Copier l’adresse",
    copied:"Adresse copiée.", failed:"Copie indisponible.", selected:"Service sélectionné",
  },
} as const;

const quote = "Be fearless when everyone is brave, and be brave when everyone is afraid.";
const contactSocials = socialLinks.filter(link => link.label === "LinkedIn" || link.label === "GitHub");

export function ContactStudio({ locale, email, emailHref, whatsappHref, topic }: {
  locale: Lang;
  email: string;
  emailHref: string;
  whatsappHref: string;
  topic?: string;
}) {
  const text = contact[locale];
  const [status, setStatus] = useState("");
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus(text.copied);
    } catch {
      setStatus(text.failed);
    }
  }

  return <>
    <header className="creative-masthead">
      <div className="creative-kicker">{text.label}<ArrowUpRight size={18} aria-hidden="true" /></div>
      <div className="creative-masthead-row"><h2 id="contact-heading">{text.hero}</h2></div>
    </header>
    <div className="creative-exhibition creative-frame contact-letter">
      <figure className="contact-signature">
        <Quote size={38} strokeWidth={1.4} aria-hidden="true" />
        <blockquote lang="en"><p>{quote}</p></blockquote>
        <figcaption><span>{text.slogan}</span><span>{text.voice}</span></figcaption>
      </figure>
      <div className="contact-letter-actions">
        {topic && <p className="creative-kicker">{text.selected} · {topic}</p>}
        <a className="contact-channel-card" href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <span><Image src="/icons/whatsapp.svg" width={26} height={26} alt="" /></span>
          <strong>{text.whatsapp}</strong><ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <div className="contact-email-card">
          <a className="contact-channel-card" href={emailHref}>
            <span><Image src="/icons/gmail.svg" width={26} height={26} alt="" /></span>
            <div><strong>{text.email}</strong><small dir="ltr">{email}</small></div><ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <button type="button" aria-label={text.copy} title={text.copy} onClick={() => void copyEmail()}><Copy size={18} aria-hidden="true" /></button>
        </div>
        <div className="contact-priority-socials">
          {contactSocials.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
            {link.image && <Image src={link.image} alt="" width={20} height={20} />}
            <span>{link.label}</span><ArrowUpRight size={14} aria-hidden="true" />
          </a>)}
        </div>
        <p className="contact-clipboard" role="status">{status}</p>
      </div>
    </div>
  </>;
}

const support = {
  en: { heading:"Support the work", eyebrow:"Support", active:"Available", soon:"Coming soon", off:"On hold", copy:"Copy account", copied:"Copied successfully.", unavailable:"Couldn’t copy. Select the account to copy it.", donate:"Donate", visit:"Visit InstaPay", wallet:"Wallet or account", vodafone:"Send directly to the Vodafone Cash wallet from Egypt.", taptap:"Send from abroad. Choose Egypt, then Vodafone Cash as the mobile wallet.", instapay:"Send an instant bank transfer through the InstaPay app." },
  fr: { heading:"Soutenir mon travail", eyebrow:"Soutien", active:"Disponible", soon:"Bientôt", off:"En pause", copy:"Copier le compte", copied:"Compte copié avec succès.", unavailable:"Impossible de copier. Sélectionnez le compte pour le copier.", donate:"Faire un don", visit:"Visiter InstaPay", wallet:"Portefeuille ou compte", vodafone:"Envoyez directement vers le portefeuille Vodafone Cash depuis l’Égypte.", taptap:"Depuis l’étranger, choisissez l’Égypte puis Vodafone Cash comme portefeuille mobile.", instapay:"Effectuez un virement bancaire instantané dans l’application InstaPay." },
} as const;

const rails = [
  { id:"vodafone", name:"Vodafone Cash", logo:"/icons/vodafone.svg", href:"https://vodafonecash.vodafone.com.eg/" },
  { id:"taptap", name:"TapTap Send", logo:"/icons/taptapsend.png", href:"https://www.taptapsend.com/" },
  { id:"instapay", name:"InstaPay", logo:"/icons/InstaPay.png", href:"https://www.instapay.eg/?lang=en" },
] as const;

type SupportMethod = (typeof rails)[number]["id"];

export function EditorialSupport({ locale, payments, instaPayHref }: {
  locale: Lang;
  payments: SitePayments;
  instaPayHref?: string;
}) {
  const text = support[locale];
  const [feedback, setFeedback] = useState<{ id: SupportMethod; copied: boolean } | null>(null);
  const copyRequest = useRef(0);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function copyAccount(id: SupportMethod, account: string) {
    const request = ++copyRequest.current;
    let copied = false;
    try {
      await navigator.clipboard.writeText(account);
      copied = true;
    } catch {
      // The visible account remains selectable when clipboard access is denied.
    }
    if (request === copyRequest.current) setFeedback({ id, copied });
  }
  return <section id="support" className="creative-section editorial-support" aria-labelledby="support-heading">
    <div className="creative-wrap">
      <header><p className="creative-kicker">{text.eyebrow}</p><h2 id="support-heading">{text.heading}</h2></header>
      <div className="support-mini-grid">
        {rails.map(item => {
          const rail = payments[item.id];
          const active = rail.state === "active";
          const instaPay = item.id === "instapay";
          const donate = active && (!instaPay || Boolean(instaPayHref || rail.account));
          const href = donate && instaPay && instaPayHref ? instaPayHref : item.href;
          const notice = feedback?.id === item.id ? feedback : null;
          const CopyIcon = notice?.copied ? Check : Copy;
          return <article key={item.id} className="support-mini-card" data-payment={item.id} data-state={rail.state}>
            <header className="support-card-header">
              <span className="support-mini-mark"><Image src={item.logo} width={34} height={34} alt="" unoptimized /></span>
              <span className="support-status"><i aria-hidden="true" />{text[rail.state]}{rail.state === "soon" && rail.at ? railDateSuffix(rail.at, locale) : ""}</span>
            </header>
            <h3>{item.name}</h3>
            <p>{text[item.id]}</p>
            {active && rail.account && <div className="support-mini-account">
              <div className="support-account-label">
                {!notice && text.wallet}
                <span className="support-feedback" role="status" data-copied={notice?.copied}>
                  {notice ? (notice.copied ? text.copied : text.unavailable) : null}
                </span>
              </div>
              <bdi>{rail.account}</bdi>
              <button type="button" aria-label={`${text.copy} · ${item.name}`} onClick={() => void copyAccount(item.id, rail.account)}>
                <CopyIcon size={17} aria-hidden="true" />
              </button>
            </div>}
            {(donate || instaPay) && <a className={donate ? "support-donate" : "support-provider-link"} href={href}
              target="_blank" rel="noopener noreferrer" aria-label={donate ? `${text.donate} · ${item.name}` : undefined}>
              {donate ? text.donate : text.visit}<ArrowUpRight size={17} aria-hidden="true" />
            </a>}
          </article>;
        })}
      </div>
    </div>
  </section>;
}
