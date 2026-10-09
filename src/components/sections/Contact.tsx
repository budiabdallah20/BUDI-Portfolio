"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { profile, socialLinks } from "@/data/portfolio";
import Logo from "@/components/Logo";
import type { SiteAvailability, SitePayments } from "@/components/WorkStatus";
import {
  AvailabilityBadge,
  PayRailBadge,
  SiteVerifiedBadge,
  VerificationBadge,
  type VerificationBadgeData,
} from "@/components/Badges";
import type { VerificationBadgeItem } from "@/components/admin/store";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const VODA_DONATE_URL = "https://vodafonecash.vodafone.com.eg/";
const TAPTAP_URL = "https://www.taptapsend.com/";
const WHATSAPP_URL = "https://wa.me/201065228072";

const PRO_LINKS = (["LinkedIn", "GitHub"] as const)
  .map((label) => socialLinks.find((s) => s.label === label))
  .filter((s): s is NonNullable<typeof s> => s !== undefined);

/** Brand glyphs as inline SVG — <img> can't inherit currentColor, inline can. */
function WhatsAppGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 640 640" className={className} aria-hidden="true" fill="currentColor">
      <path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" />
    </svg>
  );
}

function PhoneGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true" fill="currentColor">
      <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64 0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.1 18.4-30 11.6-46.3l-40-96z" />
    </svg>
  );
}

function downloadVCard(): void {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:Mohamed Abdallah",
    "TITLE:Full-Stack Developer",
    "TEL;TYPE=CELL:+201065228072",
    "EMAIL:budiabdallah922@gmail.com",
    "ADR:;;Suez;;;Egypt",
    "URL:https://github.com/budiabdallah20",
    "END:VCARD",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mohamed-abdallah.vcf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const COPY = {
  en: {
    eyebrow: "07 · Contact",
    title: "Get In Touch",
    lede: "A project, a role, or just hello — pick the channel that suits you.",
    emailLabel: "Email",
    phoneLabel: "Phone",
    locationLabel: "Location",
    whatsappLabel: "WhatsApp",
    whatsappSub: "Fast replies, any time",
    copyEmail: "Copy email",
    copyNumber: "Copy number",
    copied: "Copied",
    openChat: "Open chat",
    sendEmail: "Send email",
    callNow: "Call now",
    tapHint: "Tap to connect",
    phoneSub: "Tap to call — answers fast",
    donateEyebrow: "Support & donate",
    donateTitle: "Fuel the next build",
    donateSub: "Optional — your support keeps the open-source work and content coming.",
    optional: "Optional",
    availableNow: "Available now",
    egTitle: "Egypt · EGP",
    egSub: "Direct to my Vodafone Cash wallet",
    worldTitle: "Worldwide · Any currency",
    worldSub: "Via TapTap Send to Vodafone Cash",
    stepsEg: [
      "Open the Vodafone Cash app",
      "Send to wallet 01065228072",
      "Done — thank you!",
    ],
    stepsWorld: [
      "Open the TapTap Send app",
      "Choose Egypt → Mobile wallet",
      "Pick Vodafone Cash · 01065228072",
    ],
    donateBtn: "Donate",
    walletLabel: "Wallet",
    soon: "Coming soon",
    instaNote: "Instant transfers — launching here very soon.",
    openLabel: "Open for work",
    busyLabel: "Currently busy",
    repliesLabel: "Replies within 24h",
    ctaTitle: "Have something to build?",
    ctaSub: "Skip the forms — message me directly and get a reply within a day.",
    ctaBtn: "Chat on WhatsApp",
    featFast: "Fast replies",
    featFastSub: "Usually same day",
    featDirect: "Direct & private",
    featDirectSub: "No middlemen",
    featNospam: "Zero spam",
    featNospamSub: "Your data stays yours",
    allChannels: "Everywhere I am",
    rankFastest: "#1 · Fastest",
    rankFormal: "#2 · Formal",
    rankDirect: "#3 · Direct",
    rankVisit: "On-site",
  },
  fr: {
    eyebrow: "07 · Contact",
    title: "Me contacter",
    lede: "Un projet, un poste ou juste un bonjour — choisissez votre canal.",
    emailLabel: "E-mail",
    phoneLabel: "Téléphone",
    locationLabel: "Lieu",
    whatsappLabel: "WhatsApp",
    whatsappSub: "Réponses rapides, à tout moment",
    copyEmail: "Copier l'e-mail",
    copyNumber: "Copier le numéro",
    copied: "Copié",
    openChat: "Ouvrir le chat",
    sendEmail: "Envoyer un e-mail",
    callNow: "Appeler",
    tapHint: "Touchez pour connecter",
    phoneSub: "Touchez pour appeler — réponse vite",
    donateEyebrow: "Soutien & dons",
    donateTitle: "Propulsez le prochain projet",
    donateSub: "Optionnel — votre soutien fait vivre l'open-source et le contenu.",
    optional: "Optionnel",
    availableNow: "Disponible",
    egTitle: "Égypte · EGP",
    egSub: "Direct vers mon portefeuille Vodafone Cash",
    worldTitle: "Monde · Toute devise",
    worldSub: "Via TapTap Send vers Vodafone Cash",
    stepsEg: [
      "Ouvrez l'app Vodafone Cash",
      "Envoyez au portefeuille 01065228072",
      "C'est fait — merci !",
    ],
    stepsWorld: [
      "Ouvrez l'app TapTap Send",
      "Choisissez Égypte → Mobile wallet",
      "Vodafone Cash · 01065228072",
    ],
    donateBtn: "Faire un don",
    walletLabel: "Portefeuille",
    soon: "Bientôt",
    instaNote: "Transferts instantanés — bientôt ici.",
    openLabel: "Disponible",
    busyLabel: "Actuellement occupé",
    repliesLabel: "Réponse sous 24h",
    ctaTitle: "Un projet à construire ?",
    ctaSub: "Pas de formulaires — écrivez-moi direct, réponse sous un jour.",
    ctaBtn: "Discuter sur WhatsApp",
    featFast: "Réponses rapides",
    featFastSub: "Souvent le jour même",
    featDirect: "Direct & privé",
    featDirectSub: "Sans intermédiaires",
    featNospam: "Zéro spam",
    featNospamSub: "Vos données restent vôtres",
    allChannels: "Partout où je suis",
    rankFastest: "#1 · Le plus rapide",
    rankFormal: "#2 · Formel",
    rankDirect: "#3 · Direct",
    rankVisit: "Sur place",
  },
} as const;

/**
 * Contact — HR-first hierarchy:
 * ① hire-ready identity banner → ② one big WhatsApp CTA →
 * ③ ranked channel cards (fastest first) → ④ trust → ⑤ everywhere →
 * ⑥ quick answers → ⑦ support tucked into a discreet collapsible
 * so donations never distract a recruiter, but fans still find them.
 */
export default function Contact({
  email: emailProp,
  availability: availabilityProp,
  payments: paymentsProp,
  siteVerified: siteVerifiedProp,
  verificationBadges: verificationBadgesProp,
}: {
  email?: string;
  availability?: SiteAvailability;
  payments?: SitePayments;
  siteVerified?: boolean;
  verificationBadges?: VerificationBadgeItem[] | VerificationBadgeData[];
}): React.JSX.Element {
  const { lang, t } = useLanguage();
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const c = lang === "fr" ? COPY.fr : COPY.en;
  /** Dashboard-owned contact email wins — portfolio address is the fallback. */
  const email = emailProp || profile.email;
  /** ① Availability badge — dashboard master switch ONLY (never edited on site). */
  const avail: SiteAvailability = availabilityProp ?? { status: "available", note: "", noteFr: "", until: "" };
  /** ② Payment rails — each rail fully independent from availability + others. */
  const pay: SitePayments = paymentsProp ?? {
    vodafone: { state: "active", account: "01065228072", at: "" },
    taptap: { state: "active", account: "", at: "" },
    instapay: { state: "soon", account: "", at: "" },
  };
  /** ③ Verification — fixed site seal + dashboard-owned extra seals. */
  const siteVerified = siteVerifiedProp ?? true;
  const verificationBadges: VerificationBadgeData[] = Array.isArray(verificationBadgesProp)
    ? verificationBadgesProp.map((b, i) => ({
        id: (b as { id?: string }).id ?? `badge-${i}`,
        labelEn: (b as { labelEn?: string }).labelEn ?? "",
        labelFr: (b as { labelFr?: string }).labelFr ?? "",
        logo: (b as { logo?: string }).logo ?? "",
      }))
    : [];
  const visibleSeals = verificationBadges.filter((b) =>
    lang === "fr" ? b.labelFr !== "" || b.labelEn !== "" : b.labelEn !== "" || b.labelFr !== "",
  );
  /** Wallet number is dashboard-owned — steps + labels follow it live. */
  const withNumber = (steps: readonly string[]): string[] =>
    steps.map((s) => s.replaceAll("01065228072", pay.vodafone.account || "01065228072"));

  const copyText = (key: string, text: string): void => {
    try {
      void navigator.clipboard?.writeText(text)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(key);
    window.setTimeout(() => {
      setCopied((cur) => (cur === key ? null : cur));
    }, 1600);
  };

  /** Every card is a REAL action — tap the card itself to call, chat or email. */
  const infoCards = [
    {
      key: "whatsapp",
      glyph: "whatsapp" as const,
      logo: undefined as string | undefined,
      logoColor: "#25d366",
      logoBg: "rgba(37,211,102,0.14)",
      fallbackIcon: MessageCircle,
      color: "#25d366",
      glow: "0 18px 50px -20px rgba(37,211,102,0.6)",
      ctaBg: "linear-gradient(120deg, #25d366 0%, #7bf0a8 100%)",
      ctaFg: "#062d1a",
      label: c.whatsappLabel,
      value: c.whatsappSub,
      hint: c.tapHint,
      rank: c.rankFastest,
      valueDir: undefined,
      href: WHATSAPP_URL,
      external: true,
      ctaIcon: Send,
      cta: c.openChat,
      copyKey: null as string | null,
      copyTextValue: "",
      copyLabel: "",
    },
    {
      key: "email",
      glyph: undefined as "whatsapp" | "phone" | undefined,
      logo: "/icons/gmail.svg",
      logoColor: undefined as string | undefined,
      logoBg: "rgba(56,189,248,0.12)",
      fallbackIcon: Mail,
      color: "#38bdf8",
      glow: "0 18px 50px -20px rgba(56,189,248,0.6)",
      ctaBg: "linear-gradient(120deg, #38bdf8 0%, #a5e3ff 100%)",
      ctaFg: "#082f49",
      label: c.emailLabel,
      value: email,
      hint: c.tapHint,
      rank: c.rankFormal,
      valueDir: "ltr" as const,
      href: `mailto:${email}`,
      external: false,
      ctaIcon: Mail,
      cta: c.sendEmail,
      copyKey: "email",
      copyTextValue: email,
      copyLabel: c.copyEmail,
    },
    {
      key: "phone",
      glyph: "phone" as const,
      logo: "/icons/phone-call.svg",
      logoColor: "#d7fd44",
      logoBg: "rgba(215,253,68,0.12)",
      fallbackIcon: Phone,
      color: "#d7fd44",
      glow: "0 18px 50px -20px rgba(215,253,68,0.5)",
      ctaBg: "linear-gradient(120deg, #d7fd44 0%, #f4ffb0 100%)",
      ctaFg: "#2b3305",
      label: c.phoneLabel,
      value: profile.phoneDisplay,
      hint: c.phoneSub,
      rank: c.rankDirect,
      valueDir: "ltr" as const,
      href: profile.phoneHref,
      external: false,
      ctaIcon: Phone,
      cta: c.callNow,
      copyKey: "phone",
      copyTextValue: profile.phoneDisplay,
      copyLabel: c.copyNumber,
    },
    {
      key: "location",
      glyph: undefined as "whatsapp" | "phone" | undefined,
      logo: undefined as string | undefined,
      logoColor: undefined as string | undefined,
      logoBg: "rgba(167,139,250,0.12)",
      fallbackIcon: MapPin,
      color: "#a78bfa",
      glow: "0 18px 50px -20px rgba(167,139,250,0.6)",
      ctaBg: "linear-gradient(120deg, #a78bfa 0%, #d8ccff 100%)",
      ctaFg: "#2e1065",
      label: c.locationLabel,
      value: t.hero.location,
      hint: c.tapHint,
      rank: c.rankVisit,
      valueDir: undefined,
      href: profile.locationHref,
      external: true,
      ctaIcon: Send,
      cta: "Maps",
      copyKey: null as string | null,
      copyTextValue: "",
      copyLabel: "",
    },
  ];

  /** Payment rails — 3 independent cards, dashboard-owned, site is read-only.
   *  active → emerald live card · soon → amber teaser · off → locked maintenance.
   *  Nothing ever disappears: off renders a Lock so visitors know it's maintenance. */
  const donateRails = [
    {
      key: "vodafone",
      logo: "/icons/vodafone.svg",
      name: "Vodafone Cash",
      title: c.egTitle,
      sub: c.egSub,
      steps: withNumber(c.stepsEg),
      href: VODA_DONATE_URL,
      rail: pay.vodafone,
    },
    {
      key: "taptap",
      logo: "/icons/taptapsend.png",
      name: "TapTap Send",
      title: c.worldTitle,
      sub: c.worldSub,
      steps: withNumber(c.stepsWorld),
      href: TAPTAP_URL,
      rail: pay.taptap,
    },
    {
      key: "instapay",
      logo: "/icons/InstaPay.png",
      name: "InstaPay",
      title: "InstaPay",
      sub: c.instaNote,
      steps: [] as string[],
      href: "",
      rail: pay.instapay,
    },
  ];
  const methodNames = donateRails.map((r) =>
    r.rail.state === "active"
      ? r.name
      : r.rail.state === "soon"
        ? `${r.name} (${c.soon})`
        : `${r.name} (${lang === "fr" ? "Maintenance" : "Maintenance"})`,
  );

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-clip border-t border-border py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 50% 0%, rgba(255,61,0,0.08), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="text-stroke display pointer-events-none absolute top-16 right-0 hidden text-[20vw] leading-none opacity-20 select-none md:block"
      >
        07
      </div>
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-aurora-a absolute top-[8%] left-[4%] h-[300px] w-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,211,102,0.07) 0%, transparent 65%)" }}
          />
          <div
            aria-hidden="true"
            className="animate-aurora-b absolute right-[4%] bottom-[12%] h-[280px] w-[280px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)" }}
          />
        </>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="flex items-center gap-4 font-mono text-xs tracking-[0.35em] text-faint uppercase">
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60"
            />
            {c.eyebrow}
            <span
              aria-hidden="true"
              className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60"
            />
          </p>
          <h2
            id="contact-heading"
            className="display mt-4 text-4xl font-bold tracking-tight text-accent drop-shadow-[0_0_28px_rgba(255,61,0,0.25)] md:text-6xl xl:text-7xl"
          >
            {c.title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {c.lede}
          </p>
        </div>

        {/* ——— ① Identity banner: hire-ready at a glance ——— */}
        <div className="relative mt-12 overflow-hidden rounded-2xl p-[1.5px]">
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(215,253,68,0.5), rgba(255,61,0,0.5) 35%, rgba(167,139,250,0.5) 65%, rgba(56,189,248,0.5))",
            }}
          />
          <div className="relative flex flex-col items-center gap-5 overflow-hidden bg-surface/90 p-6 text-center backdrop-blur-xl sm:flex-row sm:gap-6 sm:p-7 sm:text-left">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 15% 20%, rgba(37,211,102,0.10), transparent 60%), radial-gradient(ellipse 60% 80% at 85% 30%, rgba(255,61,0,0.10), transparent 60%)",
              }}
            />
            {/* Site logo avatar — the real BUDI mark, no photo */}
            <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-accent/40 bg-background text-foreground shadow-[0_0_32px_rgba(215,253,68,0.25)]">
              <span className="scale-[2.1]">
                <Logo />
              </span>
              <span className="absolute inset-2 rounded-xl border border-white/15" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#25d366] shadow-[0_0_12px_rgba(37,211,102,0.9)]">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {/* ① Work badge — dashboard master switch, read-only on site */}
                <AvailabilityBadge
                  availability={avail}
                  lang={lang}
                  availableText={c.openLabel}
                  unavailableText={c.busyLabel}
                />
                <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                  <Clock className="h-3 w-3 text-accent" aria-hidden="true" />
                  {c.repliesLabel}
                </span>
              </p>
              <p className="font-display mt-2 flex flex-wrap items-center justify-center gap-2 text-2xl font-bold text-foreground sm:justify-start">
                {profile.name}
                {/* Fixed site seal — BUDI logo verification, dashboard toggle only */}
                {siteVerified && <SiteVerifiedBadge lang={lang} />}
              </p>
              {/* Extra trust seals — zero or more, all from dashboard */}
              {visibleSeals.length > 0 && (
                <p className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  {visibleSeals.map((b) => (
                    <VerificationBadge
                      key={b.id}
                      label={lang === "fr" ? b.labelFr || b.labelEn : b.labelEn || b.labelFr}
                      logo={b.logo}
                    />
                  ))}
                </p>
              )}
              <p className="mt-1 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
                {t.hero.roles[0].title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.contact.motto}</p>
            </div>
            <div className="relative flex shrink-0 flex-wrap items-center justify-center gap-2">
              {PRO_LINKS.map(({ label, href, badgeColor, image, icon: Icon, bleachGlyph, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  style={{ backgroundColor: badgeColor }}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      width={18}
                      height={18}
                      loading="lazy"
                      className={bleachGlyph ? "glyph-white h-[18px] w-[18px]" : "block h-[18px] w-[18px]"}
                    />
                  ) : Icon ? (
                    <Icon className="h-[18px] w-[18px]" />
                  ) : null}
                </a>
              ))}
              <button
                type="button"
                onClick={downloadVCard}
                aria-label={t.contact.vcard}
                title={t.contact.vcard}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-3 text-accent transition-all duration-200 hover:-translate-y-1 hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="h-[18px] w-[18px]" aria-hidden="true" />
                <span className="text-xs font-bold whitespace-nowrap">{t.contact.vcard}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ——— ② The one big action an HR actually clicks ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mt-4 overflow-hidden rounded-2xl border border-[#25d366]/30"
          style={{
            background:
              "linear-gradient(120deg, rgba(37,211,102,0.16) 0%, rgba(37,211,102,0.05) 40%, rgba(255,61,0,0.08) 100%)",
          }}
        >
          <Sparkles className="absolute -top-3 right-6 h-20 w-20 text-[#25d366]/15" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {c.ctaTitle}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{c.ctaSub}</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#25d366] px-7 py-3.5 text-sm font-bold text-[#062d1a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-12px_rgba(37,211,102,0.8)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {c.ctaBtn}
            </a>
          </div>
        </motion.div>

        {/* ——— ③ Ranked channels — every card is one big REAL button ——— */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map((card, i) => {
            const Fallback = card.fallbackIcon;
            const CtaIcon = card.ctaIcon;
            const isCopied = card.copyKey !== null && copied === card.copyKey;
            const linkProps = card.external
              ? ({ target: "_blank", rel: "noreferrer" } as const)
              : ({} as const);
            return (
              <motion.article
                key={card.key}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: (i % 4) * 0.07 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = card.glow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-surface/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5",
                  i === 0 ? "border-[#25d366]/50" : "border-border hover:border-accent/50",
                )}
                style={i === 0 ? { boxShadow: "0 0 34px -12px rgba(37,211,102,0.45)" } : undefined}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}2e 0%, ${card.color}0a 45%, transparent 65%)`,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: card.color, boxShadow: `0 0 14px ${card.color}` }}
                />
                {!reduced && i === 0 && (
                  <span
                    aria-hidden="true"
                    className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/[0.07] blur-md"
                  />
                )}
                <span className="absolute top-3 right-3 rounded-full border border-border bg-background/70 px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] text-muted uppercase backdrop-blur-sm">
                  {card.rank}
                </span>
                {/* The card face itself dials / chats / emails on tap */}
                <a
                  href={card.href}
                  {...linkProps}
                  aria-label={`${card.label} — ${card.cta}`}
                  className="relative block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span
                    className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    style={{
                      borderColor: `${card.color}66`,
                      backgroundColor: card.logoBg,
                      boxShadow: `0 0 26px -4px ${card.color}88`,
                      color: card.logoColor ?? card.color,
                    }}
                  >
                    {card.glyph === "whatsapp" ? (
                      <WhatsAppGlyph className="block h-[30px] w-[30px]" />
                    ) : card.glyph === "phone" ? (
                      <PhoneGlyph className="block h-[26px] w-[26px]" />
                    ) : card.logo ? (
                      <Image
                        src={card.logo}
                        alt=""
                        width={30}
                        height={30}
                        loading="lazy"
                        className="block h-[30px] w-[30px] object-contain"
                      />
                    ) : (
                      <Fallback className="h-6 w-6" aria-hidden="true" />
                    )}
                    {i === 0 && !reduced && (
                      <span className="animate-ping-soft absolute inset-0 rounded-2xl border-2 border-[#25d366]" />
                    )}
                  </span>
                  <p className="relative mt-4 font-mono text-[10px] tracking-[0.25em] text-faint uppercase">
                    {card.label}
                  </p>
                  <p
                    dir={card.valueDir}
                    className="relative mt-1 truncate text-base font-bold text-foreground transition-colors group-hover:text-accent"
                  >
                    {card.value}
                  </p>
                  <p className="relative mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: card.color }}>
                    <span className="relative flex h-1.5 w-1.5">
                      {!reduced && (
                        <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: card.color }} />
                      )}
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                    </span>
                    {card.hint}
                  </p>
                </a>
                <div className="relative mt-4 flex items-center gap-2 border-t border-border pt-3.5">
                  <a
                    href={card.href}
                    {...linkProps}
                    aria-label={`${card.cta} — ${card.label}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                    style={{ background: card.ctaBg, color: card.ctaFg, boxShadow: `0 10px 28px -12px ${card.color}` }}
                  >
                    <CtaIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {card.cta}
                  </a>
                  {card.copyKey !== null && (
                    <button
                      type="button"
                      onClick={() => copyText(card.copyKey as string, card.copyTextValue)}
                      aria-label={`${card.copyLabel}`}
                      title={isCopied ? c.copied : card.copyLabel}
                      className={cn(
                        "flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5",
                        isCopied
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted hover:border-accent/60 hover:text-accent",
                      )}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* ——— ④ Trust features ——— */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { icon: Zap, title: c.featFast, sub: c.featFastSub, color: "#d7fd44" },
              { icon: ShieldCheck, title: c.featDirect, sub: c.featDirectSub, color: "#38bdf8" },
              { icon: BadgeCheck, title: c.featNospam, sub: c.featNospamSub, color: "#a78bfa" },
            ] as const
          ).map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-5 py-4 backdrop-blur-md transition-colors duration-300 hover:border-accent/40"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: `${f.color}55`, backgroundColor: `${f.color}14`, color: f.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted">{f.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ——— ⑤ All channels marquee ——— */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface/40 px-4 py-4">
          <p className="text-center font-mono text-[10px] tracking-[0.3em] text-faint uppercase">
            {c.allChannels}
          </p>
          <div
            aria-label={c.allChannels}
            className="marquee relative mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          >
            <div className="marquee-track flex w-max items-center gap-2.5">
              {[...socialLinks, ...socialLinks].map((s, i) => (
                <a
                  key={`${s.label}-${i}`}
                  href={s.href}
                  aria-label={s.label}
                  title={s.label}
                  aria-hidden={i >= socialLinks.length ? true : undefined}
                  tabIndex={i >= socialLinks.length ? -1 : 0}
                  {...(s.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  style={{ backgroundColor: s.badgeColor }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/15 text-white transition-transform duration-200 hover:scale-110"
                >
                  {s.image ? (
                    <Image
                      src={s.image}
                      alt=""
                      width={18}
                      height={18}
                      loading="lazy"
                      className={s.bleachGlyph ? "glyph-white h-[18px] w-[18px]" : "block h-[18px] w-[18px]"}
                    />
                  ) : s.icon ? (
                    <s.icon className="h-[18px] w-[18px]" />
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ——— ⑥ Quick answers FAQ ——— */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface/40">
          <p className="border-b border-border px-6 py-4 text-center font-mono text-[11px] tracking-[0.3em] text-faint uppercase">
            {t.contact.faqTitle}
          </p>
          <div className="divide-y divide-white/5">
            {t.contact.faq.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-200 hover:bg-white/[0.02]"
                  >
                    <span className="flex items-center gap-3 text-sm font-bold text-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] text-accent tabular-nums">
                        {i + 1}
                      </span>
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180 text-accent" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 pl-[60px] text-sm leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ——— ⑦ Support — unmissable emerald/gold donation gate ——— */}
        <div className="relative mt-6 overflow-hidden rounded-3xl p-[2px] shadow-[0_0_70px_-14px_rgba(37,211,102,0.45)]">
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, #25d366 0%, #d7fd44 30%, #fbbf24 55%, #ff3d00 80%, #25d366 100%)",
            }}
          />
          <div
            className="relative overflow-hidden rounded-[calc(1.5rem-2px)] backdrop-blur-xl"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 10% 0%, rgba(37,211,102,0.14), transparent 55%), radial-gradient(ellipse 60% 80% at 90% 100%, rgba(251,191,36,0.12), transparent 55%), linear-gradient(180deg, #0b1410 0%, #0a0a0b 100%)",
            }}
          >
          {!reduced && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 left-[8%] h-44 w-44 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(37,211,102,0.16) 0%, transparent 65%)" }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -bottom-12 h-52 w-52 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, transparent 65%)" }}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => setSupportOpen((v) => !v)}
            aria-expanded={supportOpen}
            className="group/gate relative flex w-full cursor-pointer items-center justify-between gap-4 overflow-hidden px-6 py-5 text-left"
          >
            <span
              aria-hidden="true"
              className="animate-glare pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/[0.06] blur-md"
            />
            <span className="relative flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#062d1a] shadow-[0_0_28px_rgba(37,211,102,0.65)] transition-transform duration-300 group-hover/gate:scale-110 group-hover/gate:-rotate-6"
                style={{ background: "linear-gradient(135deg, #25d366 0%, #d7fd44 100%)" }}
              >
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
                {!reduced && (
                  <span className="animate-ping-soft absolute inset-0 rounded-2xl border-2 border-[#25d366]" />
                )}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-emerald-300/90 uppercase">
                    {c.donateEyebrow}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-px font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
                    {c.optional}
                  </span>
                  {/* Payment states only — availability lives in the identity banner above */}
                  <PayRailBadge state={pay.vodafone.state} lang={lang} at={pay.vodafone.at} />
                  <PayRailBadge state={pay.taptap.state} lang={lang} at={pay.taptap.at} />
                  <PayRailBadge state={pay.instapay.state} lang={lang} at={pay.instapay.at} />
                </span>
                <span
                  className="font-display mt-1 block truncate text-xl font-black tracking-tight sm:text-2xl"
                  style={{
                    background: "linear-gradient(100deg, #a7f3d0 10%, #fde68a 50%, #fdba74 90%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {c.donateTitle}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-muted">
                  {c.donateSub}
                </span>
              </span>
            </span>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-amber-300/10 text-amber-200 transition-all duration-300 group-hover/gate:border-amber-300 group-hover/gate:shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${supportOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </span>
          </button>
          <div
            className={`grid transition-all duration-300 ease-in-out ${supportOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-emerald-300/15 px-6 py-6">
                <p className="mx-auto max-w-lg text-center text-[13px] leading-relaxed text-muted">{c.donateSub}</p>
                {/* 3 independent rails — active = live, soon = amber teaser, off = locked */}
                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {donateRails.map((item, i) => {
                    const st = item.rail.state;
                    const locked = st === "off";
                    const soon = st === "soon";
                    const isInsta = item.key === "instapay";
                    const instaHandle = pay.instapay.account;
                    return (
                      <motion.div
                        key={item.key}
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 }}
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5",
                          st === "active" &&
                            "border-emerald-300/20 bg-background/70 shadow-[0_0_40px_-16px_rgba(37,211,102,0.35)] hover:border-emerald-300/50",
                          soon && "border-amber-300/25 bg-amber-300/[0.04] hover:border-amber-300/50",
                          locked && "border-white/10 bg-white/[0.02] opacity-95 hover:border-white/25",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute top-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
                          style={{
                            background:
                              st === "active"
                                ? "linear-gradient(to right,#25d366,#fbbf24)"
                                : soon
                                  ? "linear-gradient(to right,#fbbf24,#ff3d00)"
                                  : "linear-gradient(to right,#52525b,#71717a)",
                          }}
                        />
                        <div className="flex items-start gap-3">
                          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-1 transition-transform duration-300 group-hover:scale-105">
                            {locked && (
                              <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/55">
                                <Lock className="h-4 w-4 text-white" aria-hidden="true" />
                              </span>
                            )}
                            <Image
                              src={item.logo}
                              alt=""
                              width={36}
                              height={36}
                              loading="lazy"
                              className={cn("block h-full w-full object-contain", locked && "grayscale")}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-display truncate text-base font-bold text-foreground">
                              {item.name}
                            </h4>
                            <p className="truncate text-[13px] text-muted">{item.sub}</p>
                          </div>
                          <PayRailBadge state={st} lang={lang} at={item.rail.at} />
                        </div>

                        {st === "active" && !isInsta && (
                          <>
                            <ol className="mt-4 space-y-1.5">
                              {item.steps.map((step, si) => (
                                <li key={step} className="flex items-start gap-2.5 text-[13px] text-foreground">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 font-mono text-[10px] font-bold text-emerald-300 tabular-nums">
                                    {si + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                            <p
                              className="mt-3 font-mono text-[10px] tracking-[0.18em] text-faint uppercase tabular-nums"
                              dir="ltr"
                            >
                              {c.walletLabel}: {pay.vodafone.account}
                            </p>
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group/btn mt-3 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-black text-[#062d1a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(37,211,102,0.7)]"
                              style={{
                                background: "linear-gradient(120deg, #25d366 0%, #d7fd44 100%)",
                                boxShadow: "0 10px 34px -12px rgba(37,211,102,0.65)",
                              }}
                            >
                              {c.donateBtn}
                              <Send className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                            </a>
                          </>
                        )}

                        {st === "active" && isInsta && (
                          <div className="mt-4 flex flex-col gap-2">
                            <p className="font-mono text-[13px] text-emerald-300 tabular-nums" dir="ltr">
                              {instaHandle || (lang === "fr" ? "Bientôt disponible" : "Handle coming soon")}
                            </p>
                            {instaHandle !== "" && (
                              <button
                                type="button"
                                onClick={() => copyText("instapay", instaHandle)}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-400/15 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase transition-colors hover:bg-emerald-400/25"
                              >
                                {copied === "instapay" ? (
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                {copied === "instapay" ? c.copied : c.copyNumber}
                              </button>
                            )}
                          </div>
                        )}

                        {soon && (
                          <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-3 py-2.5 text-[13px] leading-relaxed text-amber-100/90">
                            {isInsta ? c.instaNote : lang === "fr" ? "Disponible très bientôt — restez à l'écoute." : "Launching very soon — stay tuned."}
                          </p>
                        )}

                        {locked && (
                          <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] leading-relaxed text-white/55">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {lang === "fr"
                              ? "En maintenance pour le moment — de retour bientôt."
                              : "Under maintenance right now — back soon."}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {methodNames.length > 0 && (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {methodNames.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
