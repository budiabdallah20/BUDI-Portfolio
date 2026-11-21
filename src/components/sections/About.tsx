"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock,
  Code2,
  Copy,
  Feather,
  Globe,
  GraduationCap,
  Mail,
  Quote,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { EgyptFlag, SuezFlag } from "@/components/Flags";
import CountUp from "@/components/CountUp";
import SmartImage from "@/components/SmartImage";
import { formatBadgeDate, workLabel, type SiteAvailability } from "@/components/WorkStatus";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { personal, profile, stackChips } from "@/data/portfolio";
import { techLogo } from "@/data/techLogos";
import { useNow } from "@/hooks/useNow";
import { clockParts, daysToBirthday, fullYears, parseISODate, totalDays } from "@/lib/age";
import { getAcademicStatus } from "@/lib/education";
import AboutWorkflow from "./AboutWorkflow";
import AboutChapters from "./AboutChapters";
import styles from "./about-editorial.module.css";

const motion = "(prefers-reduced-motion: no-preference)";
const finePointer = "(hover: hover) and (pointer: fine) and " + motion;
const pillars = [Zap, ShieldCheck, Feather] as const;
const birth = parseISODate(personal.birthdate);

function yearProgress(birthdate: Date, now: Date) {
  const birthday = (year: number) =>
    new Date(year, birthdate.getMonth(), birthdate.getDate()).getTime();
  const year = now.getFullYear();
  const sinceBirthday = now.getTime() >= birthday(year);
  const last = birthday(sinceBirthday ? year : year - 1);
  const next = birthday(sinceBirthday ? year + 1 : year);
  return Math.round(((now.getTime() - last) / (next - last)) * 100);
}

const copy = {
  en: {
    headlinePrefix: "I BUILD WHAT",
    headlineAccent: "I WISH EXISTED",
    story: "My story",
    storyTitle: "The story behind the code",
    chapters: ["The Builder", "The Engineer", "The Mission"],
    storyMeta: ["chapters", "min read"],
    quote: "Great software must also be safe software.",
    credit: "My Golden Rule",
    pillars: ["Performance First", "Secure by Default", "Design with Intent"],
    role: "Full-Stack Developer — Suez",
    signed: "Signed & Verified",
    contact: "Contact me",
    available: "Open for work",
    returns: "Back",
    work: "Explore My Work",
    services: "Explore Services",
    location: "Egypt",
    progress: "year complete",
    frontend: "Frontend & Security Focus",
    stats: "Numbers & Real-Time Pulse",
    statsTag: "LIME ENERGY TELEMETRY",
    contactTitle: "Have a project in mind?",
    contactSubtitle: "Let's build high-performance software that stands the test of time.",
    email: "Direct Email",
    copyEmail: "Copy email",
    copiedEmail: "Copied to clipboard!",
    dossierBadge: "OFFICIAL ACADEMIC DOSSIER",
    academicStatusLabel: "Current Standing",
    levelPrefix: "LEVEL",
    nextTransitionLabel: "Next Milestone",
  },
  fr: {
    headlinePrefix: "JE CRÉE CE QUE",
    headlineAccent: "J’AIMERAIS TROUVER",
    story: "Mon histoire",
    storyTitle: "L’histoire derrière le code",
    chapters: ["Le bâtisseur", "L’ingénieur", "La mission"],
    storyMeta: ["chapitres", "min de lecture"],
    quote: "Un grand logiciel doit aussi être un logiciel sûr.",
    credit: "Ma Règle d’Or",
    pillars: ["Performance d'abord", "Sécurisé par défaut", "Design avec intention"],
    role: "Développeur Full-Stack — Suez",
    signed: "Signé & Vérifié",
    contact: "Contactez-moi",
    available: "Disponible",
    returns: "Retour",
    work: "Voir mes projets",
    services: "Explorer les services",
    location: "Égypte",
    progress: "année écoulée",
    frontend: "Frontend & Cybersécurité",
    stats: "Télémétrie en temps réel",
    statsTag: "TÉLÉMÉTRIE LIME ENERGY",
    contactTitle: "Un projet en tête ?",
    contactSubtitle: "Bâtissons ensemble un logiciel performant, résilient et conçu pour durer.",
    email: "Email direct",
    copyEmail: "Copier l'email",
    copiedEmail: "Copié dans le presse-papiers !",
    dossierBadge: "DOSSIER ACADÉMIQUE OFFICIEL",
    academicStatusLabel: "Statut actuel",
    levelPrefix: "NIVEAU",
    nextTransitionLabel: "Prochaine étape",
  },
} as const;

function FactNumber({ value, locale }: { value: number | null; locale: string }) {
  if (value === null) return <dd className={styles.factValueEmpty}>—</dd>;
  return (
    <dd className={styles.factValue}>
      <span className="sr-only">{value.toLocaleString(locale)}</span>
      <span aria-hidden="true">
        <CountUp end={value} locale={locale} duration={850} />
      </span>
    </dd>
  );
}

function LiveFacts() {
  const { t, lang } = useLanguage();
  const now = useNow();
  const clock = birth && now ? clockParts(birth, now) : null;
  const number = (value: number | null) => (value === null ? "—" : value.toLocaleString(lang));
  const birthdayProgress = now && birth ? yearProgress(birth, now) : null;

  return (
    <section className={styles.factBand} aria-labelledby="about-facts-heading" data-about-reveal>
      <header className={styles.factBandHeader}>
        <div className={styles.factMetaRow}>
          <span className={styles.factTag}>{copy[lang].statsTag}</span>
          <span className={styles.factPulseDot} aria-hidden="true" />
        </div>
        <h3 id="about-facts-heading">{copy[lang].stats}</h3>
      </header>

      <dl className={styles.factsGrid}>
        {/* Languages counter */}
        <div className={styles.factCard}>
          <dt className={styles.factLabel}>{t.about.statsLangLabel}</dt>
          <FactNumber value={t.about.statsLangSub.split(" · ").length} locale={lang} />
          <dd className={styles.factSub}>{t.about.statsLangSub}</dd>
        </div>

        {birth && (
          <>
            {/* Age counter */}
            <div className={styles.factCard}>
              <dt className={styles.factLabel}>{t.about.statsAgeLabel}</dt>
              <FactNumber value={now ? fullYears(birth, now) : null} locale={lang} />
              <dd className={styles.factSub}>{t.about.statsAgeSub}</dd>
            </div>

            {/* Days alive & live ticking timer */}
            <div className={`${styles.factCard} ${styles.liveFactCard}`}>
              <div className={styles.factLabelRow}>
                <dt className={styles.factLabel}>{t.about.statsDaysLabel}</dt>
                <span className={styles.liveBadge} aria-label="Live continuous counting">
                  <span className={styles.liveDot} /> LIVE
                </span>
              </div>
              <FactNumber value={now ? totalDays(birth, now) : null} locale={lang} />
              <dd className={styles.timerRow}>
                <span className={styles.timerClock} dir="ltr">
                  <Clock size={13} className={styles.clockIcon} aria-hidden="true" />
                  {clock ? [clock.h, clock.m, clock.s].join(":") : "--:--:--"}
                </span>
                <span className={styles.timerLabel}>{t.about.statsDaysSub}</span>
              </dd>
            </div>

            {/* Birthday countdown */}
            <div className={styles.factCard}>
              <dt className={styles.factLabel}>{t.about.statsCakeLabel}</dt>
              <FactNumber value={now ? daysToBirthday(birth, now) : null} locale={lang} />
              <dd className={styles.factSub}>
                {birthdayProgress === null
                  ? "—"
                  : `${number(birthdayProgress)}% · ${copy[lang].progress}`}
              </dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}

function SuezClock() {
  const now = useNow();
  const { t } = useLanguage();
  const format = useMemo(
    () =>
      new Intl.DateTimeFormat(t.intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      }),
    [t.intlLocale]
  );
  return (
    <span className={styles.clock}>
      {now ? <time dateTime={now.toISOString()}>{format.format(now)}</time> : "—"} {t.hero.inSuez}
    </span>
  );
}

function useAboutEntrance(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = root.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const media = gsap.matchMedia(section);
    media.add(motion, () => {
      const tweens: gsap.core.Tween[] = [];
      const observer = new IntersectionObserver(
        (entries) => {
          for (const { isIntersecting, target } of entries) {
            if (!isIntersecting) continue;
            observer.unobserve(target);
            const parts = target.querySelectorAll(
              "[data-about-word], [role='tab'], [data-about-step], ." + styles.factCard
            );
            tweens.push(
              gsap.from(parts.length ? parts : target, {
                opacity: 0.35,
                y: parts.length ? 18 : 12,
                duration: 0.6,
                stagger: 0.06,
                ease: "power3.out",
                clearProps: "opacity,transform",
              })
            );
            if (target.hasAttribute("data-about-frame")) target.setAttribute("data-frame-ready", "");
          }
        },
        { rootMargin: "0px 0px -6% 0px" }
      );
      section.querySelectorAll("[data-about-reveal]").forEach((node) => observer.observe(node));
      return () => {
        observer.disconnect();
        tweens.forEach((tween) => tween.revert());
      };
    });
    return () => media.revert();
  }, [root]);
}

function Portrait({
  image,
  contactHref,
  availability,
}: {
  image?: string;
  contactHref: string;
  availability?: SiteAvailability;
}) {
  const { t, lang } = useLanguage();
  const words = copy[lang];
  const frame = useRef(0);
  const back = availability && formatBadgeDate(availability.until, lang);
  const status =
    availability && availability.status !== "available"
      ? workLabel(availability, lang, { available: t.hero.available, unavailable: t.hero.unavailable })
      : words.available;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !matchMedia(finePointer).matches) return;
    const { currentTarget, clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const box = currentTarget.getBoundingClientRect();
      const x = gsap.utils.clamp(0, 1, (clientX - box.left) / box.width);
      const y = gsap.utils.clamp(0, 1, (clientY - box.top) / box.height);
      currentTarget.style.setProperty("--portrait-x", x * 100 + "%");
      currentTarget.style.setProperty("--portrait-y", y * 100 + "%");
      currentTarget.style.setProperty("--portrait-pan-x", (x - 0.5) * 10 + "px");
      currentTarget.style.setProperty("--portrait-pan-y", (y - 0.5) * 8 + "px");
    });
  }

  function stop(event: PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    for (const variable of ["--portrait-x", "--portrait-y", "--portrait-pan-x", "--portrait-pan-y"]) {
      event.currentTarget.style.removeProperty(variable);
    }
  }

  return (
    <figure className={styles.portrait} data-about-reveal data-about-frame>
      <div className={styles.frame} onPointerMove={move} onPointerLeave={stop} onPointerCancel={stop}>
        <div className={styles.crop}>
          <SmartImage
            src={image?.trim() || "/images/general/editorial-portrait-refined.webp"}
            alt={t.about.photoAlt}
            fill
            sizes="(max-width: 540px) calc(100vw - 34px), (max-width: 767px) 440px, (max-width: 1200px) 39vw, 535px"
            quality={85}
            className={styles.image}
          />
        </div>
        <span className={styles.corners} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.frameAestheticBorder} aria-hidden="true" />
      </div>

      <figcaption className={styles.caption}>
        <div className={styles.captionPrimary}>
          <strong>{profile.name}</strong>
          <span className={styles.captionRole}>{words.role}</span>
        </div>
        <div className={styles.location}>
          <span>
            <SuezFlag /> Suez
          </span>
          <span>
            <EgyptFlag /> {words.location}
          </span>
          <span dir="ltr" className={styles.coords}>
            29.97°N · 32.55°E
          </span>
          <SuezClock />
        </div>
        <a className={styles.availability} href={contactHref}>
          <span className={styles.availPill}>
            <span className={styles.availDot} />
            {status}
            {back && availability?.status !== "available" ? ` · ${words.returns} ${back}` : ""}
          </span>
          <span className={styles.availAction}>
            {words.contact}
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </a>
      </figcaption>
    </figure>
  );
}

export default function About({
  availability,
  image,
  contactHref = "mailto:" + profile.email,
  projectsVisible = true,
}: {
  availability?: SiteAvailability;
  image?: string;
  contactHref?: string;
  projectsVisible?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const { t, lang } = useLanguage();
  const words = copy[lang];
  const academicStatus = getAcademicStatus();
  const school = personal.education[0];
  const readMins = Math.max(1, Math.round(t.about.story.join(" ").split(/\s+/).length / 200));

  const [copied, setCopied] = useState(false);

  function handleCopyEmail() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  }

  useAboutEntrance(root);

  return (
    <section ref={root} id="about" aria-labelledby="about-heading" className={styles.section}>
      <div className={styles.shell}>
        {/* Signature Editorial Header (Section 04) */}
        <header className={styles.intro}>
          <p className={styles.marker}>02 / {t.about.title}</p>
          <h2 id="about-heading" data-about-reveal className={styles.headline}>
            <span className={styles.headlineLine}>{words.headlinePrefix}</span>{" "}
            <span className={styles.headlineLine}>
              <em className={styles.orangeAccent}>{words.headlineAccent}</em>
            </span>
          </h2>
        </header>

        {/* Identity metadata strip */}
        <ul className={styles.identityStrip} role="list" data-about-reveal>
          <li>
            <SuezFlag /> Suez, Egypt
          </li>
          {school && (
            <>
              <li>{school.school[lang]}</li>
              <li>{school.faculty[lang]}</li>
              <li>{school.department[lang]}</li>
            </>
          )}
          <li>
            <Sparkles size={14} className={styles.identityIcon} aria-hidden="true" />
            {words.frontend}
          </li>
        </ul>

        {/* Main Spread: Portrait + Story Chapters */}
        <div className={styles.spread}>
          <Portrait image={image} contactHref={contactHref} availability={availability} />
          <div className={styles.story}>
            <header data-about-reveal>
              <div className={styles.storyMeta}>
                <span>{words.story}</span>
                <span>
                  {t.about.story.length} {words.storyMeta[0]} · ~{readMins} {words.storyMeta[1]}
                </span>
              </div>
              <h3 className={styles.storyMainTitle}>{words.storyTitle}</h3>
              <p className={styles.lede}>{t.about.lede}</p>
              <p className={styles.current}>
                <span className={styles.currentDot} />
                {t.hero.currently} — {t.hero.building}
              </p>
            </header>
            <AboutChapters
              labels={words.chapters}
              story={t.about.story}
              title={words.story}
              lang={lang}
            />
          </div>
        </div>

        {/* Signature Quotation Experience (Section 06) */}
        <figure className={styles.quoteFrame} data-about-reveal>
          <div className={styles.quoteWatermark} aria-hidden="true">
            “
          </div>
          <header className={styles.quoteHeader}>
            <Quote size={24} strokeWidth={1.5} aria-hidden="true" className={styles.quoteGlyph} />
            <span>{words.credit}</span>
          </header>
          <blockquote className={styles.quote}>“{words.quote}”</blockquote>
          <figcaption className={styles.signature}>
            <div className={styles.sigAuthor}>
              <strong>{profile.name}</strong>
              <span>Full-Stack Engineer & Cybersecurity Researcher · Suez</span>
            </div>
            <span className={styles.signedBadge}>
              <Feather size={14} aria-hidden="true" /> {words.signed}
            </span>
          </figcaption>
        </figure>

        {/* Engineering Pillars */}
        <ul className={styles.pillars} role="list" data-about-reveal>
          {words.pillars.map((label, index) => {
            const Icon = pillars[index];
            return (
              <li key={label} className={styles.pillarCard}>
                <div className={styles.pillarIconWrap} aria-hidden="true">
                  <Icon size={19} strokeWidth={1.75} />
                </div>
                <strong>{label}</strong>
              </li>
            );
          })}
        </ul>

        {/* Education & Academic Dossier (Section 08, 09, 11) */}
        <div className={styles.record}>
          {personal.education.length > 0 && school && (
            <div className={styles.academicDossier} data-about-reveal>
              <div className={styles.dossierTop}>
                <span className={styles.dossierTag}>{words.dossierBadge}</span>
                <span className={styles.dossierLevelBadge}>
                  <GraduationCap size={15} aria-hidden="true" />
                  {words.levelPrefix} {academicStatus.levelPadded} / {academicStatus.levelTotal}
                </span>
              </div>

              <h3 className={styles.dossierTitle}>{school.school[lang]}</h3>

              <div className={styles.dossierMeta}>
                <dl className={styles.schoolFacts}>
                  <div>
                    <dt>{t.about.eduFaculty}</dt>
                    <dd>{school.faculty[lang]}</dd>
                  </div>
                  <div>
                    <dt>{t.about.eduDept}</dt>
                    <dd>{school.department[lang]}</dd>
                  </div>
                  <div>
                    <dt>{words.academicStatusLabel}</dt>
                    <dd>
                      <strong className={styles.activeLevelHighlight}>
                        {lang === "fr" ? academicStatus.academicYearFr : academicStatus.academicYearEn}
                      </strong>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Segmented 4-Stage Progress Rail (Section 08) */}
              <div className={styles.progressRailSection}>
                <div className={styles.railHeaderRow}>
                  <span className={styles.railLabel}>ACADEMIC PROGRESSION</span>
                  <span className={styles.railPercent}>{academicStatus.progressPercent}% YEAR CYCLE</span>
                </div>

                <div className={styles.stagesRail} role="progressbar" aria-valuenow={academicStatus.progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  {academicStatus.stages.map((stage) => {
                    const isCompleted = stage.status === "completed";
                    const isCurrent = stage.status === "current";
                    return (
                      <div
                        key={stage.level}
                        className={`${styles.stageSegment} ${
                          isCompleted
                            ? styles.stageCompleted
                            : isCurrent
                            ? styles.stageCurrent
                            : styles.stageUpcoming
                        }`}
                      >
                        <div className={styles.stageTrack}>
                          {isCurrent && (
                            <span
                              className={styles.stageFill}
                              style={{ width: `${academicStatus.progressPercent}%` }}
                            />
                          )}
                        </div>
                        <div className={styles.stageInfo}>
                          <span className={styles.stageNum}>L{stage.levelNumber}</span>
                          <span className={styles.stagePeriod}>{stage.period}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className={styles.nextTransitionNote}>
                  <Clock size={13} aria-hidden="true" />
                  <span>
                    {lang === "fr"
                      ? academicStatus.nextTransitionFr
                      : academicStatus.nextTransitionEn}
                  </span>
                </p>
              </div>

              {/* Official Institutional Seals in authentic colors (Section 09) */}
              <div className={styles.officialMarks}>
                <figure className={styles.markFrame}>
                  <div className={styles.markImageWrap}>
                    <Image
                      src="/images/education/suez-official.png"
                      alt="Official Suez University emblem"
                      width={68}
                      height={68}
                      className={styles.officialLogo}
                    />
                  </div>
                  <figcaption className={styles.markCaption}>{school.school[lang]}</figcaption>
                </figure>
                <figure className={styles.markFrame}>
                  <div className={styles.markImageWrap}>
                    <Image
                      src="/images/education/science-official.jpg"
                      alt="Official Faculty of Science emblem"
                      width={68}
                      height={68}
                      className={styles.officialLogo}
                    />
                  </div>
                  <figcaption className={styles.markCaption}>{school.faculty[lang]}</figcaption>
                </figure>
              </div>
            </div>
          )}

          {/* Highlights & Engineering Principles */}
          <div className={styles.highlightsContainer} data-about-reveal>
            <div className={styles.highlightsHeader}>
              <span className={styles.highlightsBadge}>SIGNATURE STANDARDS</span>
              <h3 className={styles.highlightsTitle}>
                {lang === "fr" ? "Principes Clés & Livrables" : "Core Principles & Output"}
              </h3>
            </div>
            <div className={styles.highlightsList}>
              {t.about.cards.map((item, idx) => {
                const themes = [
                  { tag: "PRODUCTION", color: "orange", icon: Code2 },
                  { tag: "SECURITY", color: "emerald", icon: ShieldCheck },
                  { tag: "GLOBAL", color: "gold", icon: Globe },
                  { tag: "LIVE STATUS", color: "lime", icon: Zap },
                ];
                const theme = themes[idx] || themes[0];
                const Icon = theme.icon;
                return (
                  <div key={item.title} className={styles.highlightCard} data-theme={theme.color}>
                    <div className={styles.highlightCardHeader}>
                      <span className={styles.highlightIndex}>0{idx + 1}</span>
                      <span className={styles.highlightTag}>
                        <Icon size={12} aria-hidden="true" />
                        {theme.tag}
                      </span>
                    </div>
                    <div className={styles.highlightContent}>
                      <h4 className={styles.highlightCardTitle}>{item.title}</h4>
                      <p className={styles.highlightCardSub}>{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Complete Counter Redesign: LIME ENERGY NUMERICS (Section 10) */}
        <LiveFacts />

        {/* How I Work: Interactive Process (Section 12) */}
        <AboutWorkflow />

        {/* Finish / Technology Strip & Email CTA (Section 13, 14) */}
        <div className={styles.finish} data-about-reveal>
          <div className={styles.finishTop}>
            <span className={styles.techBadge}>CORE TECHNOLOGICAL STACK</span>
            <ul className={styles.stack} role="list">
              {stackChips.map((chip) => {
                const logo = techLogo(chip);
                return (
                  <li key={chip} className={styles.stackChip}>
                    {logo && (
                      <Image
                        src={logo}
                        alt=""
                        width={18}
                        height={18}
                        className={styles.stackIcon}
                      />
                    )}
                    <span>{chip}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.contactPanel}>
            <div className={styles.contactText}>
              <h3 className={styles.contactTitle}>{words.contactTitle}</h3>
              <p className={styles.contactSub}>{words.contactSubtitle}</p>
            </div>

            <div className={styles.actions}>
              {/* Primary Chamfered Orange CTA */}
              <a
                className={styles.cta}
                href={projectsVisible ? "#projects" : "#services"}
              >
                <span>{projectsVisible ? words.work : words.services}</span>
                <ArrowUpRight size={19} aria-hidden="true" className={styles.ctaArrow} />
              </a>

              {/* Interactive Email Copy / Mailto Action */}
              <div className={styles.emailPillWrap}>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={styles.emailCopyBtn}
                  aria-label={copied ? words.copiedEmail : words.copyEmail}
                  title={words.copyEmail}
                >
                  {copied ? (
                    <CheckCheck size={17} className={styles.copiedIcon} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  <span>{copied ? words.copiedEmail : profile.email}</span>
                </button>

                <a
                  href={"mailto:" + profile.email}
                  className={styles.emailDirectLink}
                  aria-label={words.email}
                  title="Open in mail client"
                >
                  <Mail size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
