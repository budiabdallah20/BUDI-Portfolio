"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, ChevronDown, Mail, MapPin, Menu, X } from "lucide-react";
import Image from "next/image";
import Logo from "@/components/Logo";
import LangFlag from "@/components/layout/LangFlag";
import ErrorReporter from "@/components/ErrorReporter";
import RealtimeRefresh from "@/components/home/RealtimeRefresh";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { availabilityFromSettings, paymentsFromSettings } from "@/components/WorkStatus";
import About from "@/components/sections/About";
import Certificates from "@/components/sections/Certificates";
import Contact from "@/components/sections/Contact";
import { EditorialSupport } from "@/components/sections/ContactStudio";
import Footer from "@/components/layout/Footer";
import { homeSectionHref, isHomeAnchorVisible, type HomeVisibility } from "@/config/home-visibility";
import { TECH_STACK } from "@/data/techLogos";
import { navLinks, profile, socialLinks } from "@/data/portfolio";
import { useWeather } from "@/hooks/useWeather";
import { HeroGreeting, HeroPresence } from "./HeroPresence";
import type { RemoteContent } from "@/lib/content";
import { isPublicStudioProject } from "@/lib/studio-projects";
import EditorialLoader from "./EditorialLoader";
import EditorialProjects from "@/components/sections/EditorialProjects";
import EditorialSkills from "@/components/sections/EditorialSkills";
import EditorialServices from "@/components/sections/EditorialServices";
import { useEditorialHero, useEditorialSectionTracking, useEditorialWorkAnchor } from "./editorial-motion";
import "./editorial.css";
import "./obsidian-gold.css";
import "./editorial-footer.css";
import "./editorial-refresh.css";

const portraitPath = "/images/general/editorial-portrait-refined.webp";
const supportedLanguages = ["en", "fr"] as const;
const languageNames = { en: "English", fr: "Français" };
const primarySocials = socialLinks.filter(link => ["GitHub", "LinkedIn", "Instagram", "WhatsApp"].includes(link.label));
const heroTech = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP"].flatMap(name => TECH_STACK.filter(tech => tech.name === name));
const sectionIds = navLinks.map(link => link.id);
const roleLetters = (word: string) => Array.from(word, (letter,index) =>
  <span className="editorial-role-letter" key={index}>{letter}</span>);

export default function EditorialLanding({ content, visibility, instaPayHref }: {
  content: RemoteContent | null;
  visibility: HomeVisibility;
  instaPayHref?: string;
}) {
  const { lang, t, switchLanguage } = useLanguage();
  const fr = lang === "fr";
  const weather = useWeather();
  const menu = useRef<HTMLDetailsElement>(null);
  const language = useRef<HTMLDetailsElement>(null);
  const [entered, setEntered] = useState(false);
  const [anchor, setAnchor] = useState("#home");
  const [floating, setFloating] = useState(false);
  const header = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const hero = useRef<HTMLElement>(null);
  useEditorialHero(hero, entered);
  useEditorialWorkAnchor(visibility.projects || visibility.skills);
  useEditorialSectionTracking(main, header, sectionIds, setAnchor);

  useEffect(() => {
    if (!entered) return;
    const hash = window.location.hash;
    const id = sectionIds.find(section => section !== "home" && "#" + section === hash);
    const target = id && document.getElementById(id);
    if (!target || !main.current?.contains(target)) return;
    // The loader can mask the browser's first fragment scroll during hydration.
    const frame = requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [entered]);

  const visibleLinks = navLinks.filter(link => isHomeAnchorVisible(link.href, visibility));

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (target) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "start", behavior: reduced ? "instant" : "smooth" });
      if (window.location.hash !== href) window.history.pushState(window.history.state, "", href);
      setAnchor(href);
    }
  };

  const email = content?.settings?.contactEmail || profile.email;
  const projects = (content?.projects ?? t.projects.items).filter(isPublicStudioProject).length;
  const certificates = content?.certs.filter(cert => cert.visible !== false && Boolean(cert.titleEn?.trim() || cert.titleFr?.trim() || /^study-/i.test(cert.id))).length;
  const availability = availabilityFromSettings(content?.settings ?? null);
  const payments = paymentsFromSettings(content?.settings ?? null);
  const settingsDecorations = content?.settings as (RemoteContent["settings"] & {
    siteVerified?: boolean;
    verificationBadges?: { id: string; labelEn: string; labelFr: string; logo: string }[];
  }) | undefined;
  const connected = content !== null;

  useEffect(() => {
    let raised = false;
    const morph = () => {
      const next = raised ? window.scrollY > 54 : window.scrollY >= 90;
      if (next !== raised) {
        raised = next;
        setFloating(next);
      }
    };
    morph();
    window.addEventListener("scroll", morph, { passive: true });
    const dismiss = (event: PointerEvent) => {
      for (const details of [menu.current, language.current]) {
        if (details?.open && event.target instanceof Node && !details.contains(event.target)) details.open = false;
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("scroll", morph);
    };
  }, []);

  useEffect(() => {
    if (!connected || ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname)) return;
    try {
      if (sessionStorage.getItem("budi-visit-sent")) return;
      sessionStorage.setItem("budi-visit-sent", "1");
    } catch {
      return;
    }
    void fetch("/api/engagement/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "site" }),
    }).catch(() => undefined);
  }, [connected]);

  function closeOnEscape(event: React.KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape" || !event.currentTarget.open) return;
    event.currentTarget.open = false;
    event.currentTarget.querySelector("summary")?.focus();
  }

  return (
    <div className="editorial-page" data-entered={entered}>
      <RealtimeRefresh />
      <ErrorReporter />
      <EditorialLoader enabled={content?.settings?.showLoader !== false} onReady={setEntered} />
      <noscript><style>{".editorial-loader{display:none!important}"}</style></noscript>
      <a className="editorial-skip" href="#home">{fr ? "Aller au contenu" : "Skip to content"}</a>

      <header ref={header} className="editorial-header" data-floating={floating}>
        <nav className="editorial-shell editorial-nav" aria-label={fr ? "Navigation principale" : "Primary navigation"}>
          <a href="#home" onClick={(e) => handleNavClick(e, "#home")} className="editorial-brand" aria-label={fr ? "BUDI, accueil" : "BUDI, home"}><Logo variant="full" /></a>
          <div className="editorial-nav-links">
            {visibleLinks.map(link => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                aria-current={anchor === link.href ? "location" : undefined}
              >
                {t.nav[link.id]}
              </a>
            ))}
          </div>
          <div className="editorial-nav-tools">
            <details className="editorial-dropdown" ref={language} onKeyDown={closeOnEscape}>
              <summary aria-label={fr ? "Choisir la langue" : "Choose language"}><LangFlag lang={lang} /><ChevronDown size={14} aria-hidden="true" /></summary>
              <div className="editorial-popover">
                {supportedLanguages.map(option => <button key={option} type="button" aria-current={lang === option ? "true" : undefined} onClick={() => {
                  if (language.current) language.current.open = false;
                  if (option !== lang) switchLanguage(option, true);
                  else language.current?.querySelector("summary")?.focus();
                }}><LangFlag lang={option} />{languageNames[option]}</button>)}
              </div>
            </details>
            <a className="editorial-nav-cv" href="/documents/cv.html">CV<ArrowUpRight size={14} aria-hidden="true" /></a>
            {visibility.contact && (
              <a className="editorial-hire" href="#contact" onClick={(e) => handleNavClick(e, "#contact")}>
                {fr ? "Engagez-moi" : "Hire me"}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
            <details className="editorial-dropdown editorial-mobile-menu" ref={menu} onKeyDown={closeOnEscape}>
              <summary aria-label={fr ? "Menu de navigation" : "Navigation menu"}><Menu className="editorial-menu-open" size={21} /><X className="editorial-menu-close" size={21} /></summary>
              <div className="editorial-popover" onClick={() => { if (menu.current) menu.current.open = false; }}>
                {visibleLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => {
                      if (menu.current) menu.current.open = false;
                      handleNavClick(e, link.href);
                    }}
                    aria-current={anchor === link.href ? "location" : undefined}
                  >
                    {t.nav[link.id]}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </nav>
      </header>

      <main ref={main} id="content">
        {content?.settings?.maintenance && <p className="editorial-maintenance">{fr ? "Site en maintenance" : "Site maintenance in progress"}</p>}
        <section ref={hero} id="home" className="editorial-shell editorial-hero" aria-labelledby="hero-heading">
          <div className="editorial-dateline">
            <div className="hero-dateline-lead">
              <HeroPresence locale={lang} availability={availability} />
              <HeroGreeting locale={lang} />
            </div>
            <a href={profile.locationHref} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true" />
              {fr ? "Suez, Égypte" : "Suez, Egypt"}{weather && <span> · {weather.tempC} °C</span>}
            </a>
          </div>
          <div className="editorial-cover">
            <h1 id="hero-heading" tabIndex={-1}>
              <span className="editorial-intro">{fr ? "SALUT, MOI C’EST " : "HEY, I’M "}<span className="editorial-name">MOHAMED</span></span>
              <span className="sr-only">{fr ? "Développeur full stack" : "Full stack developer"}</span>
              <span className="editorial-kinetic-mask" aria-hidden="true"><span className="editorial-kinetic">{fr ? roleLetters("DÉVELOPPEUR") : <>{roleLetters("FULL")} <span className="editorial-role-word">{roleLetters("STACK")}</span></>}</span></span>
              <span className="editorial-kinetic-mask" aria-hidden="true"><span className="editorial-kinetic">{fr ? <>{roleLetters("FULL")} <span className="editorial-role-word">{roleLetters("STACK")}</span></> : roleLetters("DEVELOPER")}</span></span>
            </h1>
            <span className="editorial-portrait-light" aria-hidden="true" />
            <figure className="editorial-portrait">
              <span className="editorial-portrait-plane">
                <Image src={portraitPath} width={800} height={759} sizes="(max-width: 620px) 77vw, (max-width: 900px) 43vw, 430px" preload unoptimized alt={t.hero.photoAlt} />
              </span>
            </figure>
            <span className="editorial-chip editorial-chip-location"><span className="editorial-chip-drift">{fr ? "BASÉ À SUEZ" : "BASED IN SUEZ"}</span></span>
          </div>
          <div className="editorial-hero-footer">
            <div className="editorial-socials" aria-label={t.hero.socials}>
              {primarySocials.map(link => <a key={link.label} href={link.href} data-platform={link.label.toLowerCase()} aria-label={link.label} data-tooltip={link.label} target="_blank" rel="noopener noreferrer">
                <span className="editorial-social-body">{link.image && <Image src={link.image} alt="" width={24} height={24} />}</span>
              </a>)}
              <a href={`mailto:${email}`} data-platform="email" aria-label={fr ? "E-mail" : "Email"} data-tooltip={fr ? "E-mail" : "Email"}><span className="editorial-social-body"><Mail size={24} aria-hidden="true" /></span></a>
            </div>
            <div className="editorial-cta"><a href="/documents/cv.html" className="editorial-resume"><span className="editorial-magnet-body">{fr ? "Voir mon CV" : "View résumé"}<ArrowUpRight size={17} aria-hidden="true" /></span></a><a href={homeSectionHref("#about", visibility)} onClick={(e) => handleNavClick(e, "#about")}>{fr ? "Explorer" : "Scroll to explore"} <ArrowDown size={15} aria-hidden="true" /></a></div>
            <dl className="editorial-stats">
              {([[projects,t.nav.projects],[certificates,t.nav.certificates]] as const).map(([count,label]) => <div key={label}><dd>
                {count === undefined ? <abbr title={fr ? "Données indisponibles" : "Data unavailable"}>—</abbr> : <><span className="sr-only">{count.toLocaleString(lang)}</span><span aria-hidden="true" data-editorial-count={count}>{count}</span></>}
              </dd><dt>{label}</dt></div>)}
            </dl>
          </div>
          <div className="editorial-tech" tabIndex={0} aria-label={fr ? "Technologies utilisées" : "Technologies used"}>
            <p>{fr ? "Technologies" : "Built with"}</p>
            <div className="editorial-tech-window" dir="ltr">
              <div className="editorial-tech-track">
                {[false, true].map(duplicate => (
                  <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className={duplicate ? "editorial-tech-copy" : undefined}>
                    {heroTech.map(tech => <li key={tech.name} data-tech={tech.name}>
                      <Image src={tech.logo} alt="" width={19} height={19} />
                      <span>{tech.name}</span>
                    </li>)}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </section>

        {visibility.about && <About availability={availability} image={content?.settings?.aboutImage || portraitPath}
          contactHref={visibility.contact ? "#contact" : "mailto:" + email} projectsVisible={visibility.projects} />}
        <EditorialServices content={content} visibility={visibility} email={email} />
        {visibility.projects && <EditorialProjects content={content} />}
        {visibility.skills && <EditorialSkills content={content} visibility={visibility} />}
        {visibility.certificates && <Certificates remote={content?.certs} />}
        {visibility.contact && <EditorialSupport locale={lang} payments={payments} instaPayHref={instaPayHref} />}
        {visibility.contact && <Contact email={email} editorial availability={availability} payments={payments} siteVerified={settingsDecorations?.siteVerified !== false}
          verificationBadges={Array.isArray(settingsDecorations?.verificationBadges) ? settingsDecorations.verificationBadges : []} />}
      </main>
      {visibility.footer && <Footer image="/images/general/contact-editorial-portrait.webp" email={email} availability={availability} editorial visibility={visibility} />}
    </div>
  );
}
