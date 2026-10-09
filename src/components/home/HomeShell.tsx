"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import WelcomeToast from "@/components/home/WelcomeToast";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import RealtimeRefresh from "@/components/home/RealtimeRefresh";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RemoteContent } from "@/lib/content";
import { availabilityFromSettings, paymentsFromSettings } from "@/components/WorkStatus";
import About from "@/components/sections/About";
import AboutManifesto from "@/components/sections/AboutManifesto";
import ScrollPlay from "@/components/sections/ScrollPlay";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Certificates from "@/components/sections/Certificates";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";

/**
 * Phase-01 shell: owns the loading → reveal handoff.
 * Future phases mount <About/>, <Projects/>… inside <main> below <Hero/>
 * without touching the loading/navbar logic.
 *
 * Loading policy (fixed): repeat visits inside one tab session skip the
 * intro — and the decision is taken in a useLayoutEffect AFTER the first
 * (deterministic, hydration-safe) render but BEFORE paint. The old approach
 * decided inside the state initializer, so the server (no sessionStorage)
 * rendered the loader while a returning client rendered the navbar —
 * hydration mismatch, React regenerated the whole tree, ScrollTrigger
 * measured torn-down sections and the page stuck until a hard refresh
 * (incognito always worked because a fresh session agreed with the SSR).
 * Now server and client paint the identical tree, the skip lands
 * pre-paint with no flash, and the loader either never runs its effects
 * (skip path) or plays fully (first-visit path).
 */
function shouldSkipIntro(): boolean {
  try {
    return sessionStorage.getItem("budi-seen") === "1";
  } catch {
    /* storage blocked — always play the intro */
    return false;
  }
}

export default function HomeShell({ content }: { content: RemoteContent | null }): React.JSX.Element {
  const showLoader = content?.settings?.showLoader !== false;
  const maintenance = content?.settings?.maintenance === true;
  const likesEnabled = content?.settings?.likesEnabled !== false;
  const contactEmail = content?.settings?.contactEmail || undefined;
  /** Dashboard-owned badges — one switch drives navbar, footer, about, contact. */
  const availability = availabilityFromSettings(content?.settings ?? null);
  const payments = paymentsFromSettings(content?.settings ?? null);
  const rawSettings = (content?.settings ?? null) as unknown as Record<string, unknown> | null;
  const siteVerified = rawSettings?.siteVerified !== false;
  const verificationBadges = Array.isArray(rawSettings?.verificationBadges)
    ? (rawSettings?.verificationBadges as { id: string; labelEn: string; labelFr: string; logo: string }[])
    : [];
  const [loading, setLoading] = useState<boolean>(showLoader);
  const completedRef = useRef(false);
  const { lang } = useLanguage();
  const handleComplete = useCallback((): void => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      sessionStorage.setItem("budi-seen", "1");
    } catch {
      /* storage blocked — show the intro every time */
    }
    setLoading(false);
  }, []);

  // DETERMINISTIC first paint (hydration fix): the server has no
  // sessionStorage, so it ALWAYS renders the loader. If the client decided
  // the skip inside the state initializer, returning visitors would render
  // a different tree (navbar instead of curtain) → React discards the SSR
  // HTML, rebuilds every GSAP/ScrollTrigger context on a torn-down DOM,
  // and the site sits stuck until a hard refresh (works in incognito only
  // because a fresh session agrees with the server). Instead both sides
  // render the loader, then this layout effect skips it BEFORE paint —
  // zero mismatch, zero flash, the curtain's own effects never even run.
  useLayoutEffect(() => {
    if (!showLoader || shouldSkipIntro()) {
      handleComplete();
    }
  }, [showLoader, handleComplete]);

  // HARD RESET on every (re)mount: the browser loves restoring the old
  // scroll position on refresh — landing mid-way inside the pinned
  // ScrollPlay stage while the loader locks the body mis-measures every
  // ScrollTrigger and the page feels stuck until a second refresh.
  // Manual restoration + instant top puts every load on the same start
  // line; the deep-link effect below still honors #hash links after lift.
  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      /* older browsers — default behavior stays */
    }
    window.scrollTo(0, 0);
  }, []);

  // LAST-RESORT watchdog: the loader curtain has its own 4.5s timer plus
  // a pure-CSS 7s self-dismiss — but those only hide the curtain. If the
  // React callback never lands (blocked chunk, thrown error, throttled
  // tab), `loading` stays true forever: navbar hidden, hero frozen, and
  // the visitor must refresh to unstick the site. This forces the same
  // handoff from the parent side so the app can never strand itself.
  useEffect(() => {
    if (!loading) return;
    const id = window.setTimeout(() => {
      handleComplete();
    }, 8000);
    return (): void => {
      window.clearTimeout(id);
    };
  }, [loading, handleComplete]);

  // Real visit counting — one increment per tab session, RPC-guarded.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("budi-visit-sent")) return;
      sessionStorage.setItem("budi-visit-sent", "1");
    } catch {
      return;
    }
    void (async (): Promise<void> => {
      try {
        await supabaseBrowser().rpc("increment_visit", { p_id: "site" });
      } catch {
        /* offline or unreachable — local fallback stays in the dashboard */
      }
    })();
  }, []);
  // ScrollTriggers across sections are created while the loader locks the
  // body — refresh their measurements the moment the curtain lifts so every
  // reveal fires at the right scroll position (soft and hard refresh alike).
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void import("gsap/ScrollTrigger")
        .then((m) => {
          if (!cancelled) m.ScrollTrigger?.refresh();
        })
        .catch(() => undefined);
    }, 450);
    return (): void => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loading]);

  // Deep links (/#skills from dashboard previews or shared links) win:
  // native anchor scroll happens before hydration under the loader curtain,
  // so re-assert it explicitly once the curtain lifts. Otherwise every visit
  // starts fresh at the top — no last-section memory, like the first time.
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
      }, 750);
      return (): void => {
        window.clearTimeout(timer);
      };
    }
    window.scrollTo(0, 0);
  }, [loading]);

  return (
    <>
      <RealtimeRefresh />
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[110] focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
      >
        {lang === "fr" ? "Aller au contenu" : "Skip to content"}
      </a>
      {loading && <LoadingScreen onComplete={handleComplete} />}
      {maintenance && !loading && (
        <p className="relative z-[105] bg-amber-400 px-4 py-2 text-center font-mono text-[11px] tracking-[0.2em] text-black uppercase">
          {lang === "fr" ? "Mode maintenance — mises à jour en cours" : "Maintenance mode — updates in progress"}
        </p>
      )}
      <Navbar visible={!loading} availability={availability} />
      {!loading && <WelcomeToast />}
      <main id="content">
        <Hero start={!loading} image={content?.settings?.heroImage || undefined} />
        <About availability={availability} image={content?.settings?.aboutImage || undefined} />
        <AboutManifesto />
        <ScrollPlay />
        <Services remote={content?.services} />
        <Projects remote={content?.projects} remoteLikes={content?.likes} likesEnabled={likesEnabled} />
        <Skills remote={content?.skills} projects={content?.projects} />
        <Certificates remote={content?.certs} />
        <Contact email={contactEmail} availability={availability} payments={payments} siteVerified={siteVerified} verificationBadges={verificationBadges} />
      </main>
      <Footer email={contactEmail} availability={availability} />
    </>
  );
}
