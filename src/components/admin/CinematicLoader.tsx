"use client";
import {useEffect,useRef,type ReactNode} from "react";
import Logo from "@/components/Logo";
import {BUDI_MARK_PATH} from "@/lib/brand";
interface CinematicLoaderProps {
  /** Wordmark — rendered letter by letter with the fill sweep. */
  word: string;
  /** Quiet line under the wordmark (e.g. a role or tagline). */
  subtitle?: string;
  /** Screen-reader label for the curtain. */
  label: string;
  /** Bottom-left caption (e.g. "Loading dashboard"). */
  trackLabel?: string;
  /** Optional status chips (control center). */
  chips?: ReactNode;
  /** Optional rotating boot lines — the "alive" thread. */
  bootLines?: readonly string[];
  /** Main accent (fill, bar, glow). */
  accent: string;
  /** Secondary accent (gradient end, secondary orb). */
  accentAlt: string;
  /** Deepest background color. */
  bg: string;
  /** Tailwind z-index class for the curtain. */
  zClass?: string;
  /** Hard cap in ms — the curtain lifts even if the choreography stalls. */
  watchdogMs?: number;
  onComplete: () => void;
}


/** Short, skippable brand introduction; it does not pretend to measure network progress. */
export default function CinematicLoader({word,subtitle,label,zClass="z-[200]",onComplete}:CinematicLoaderProps):React.JSX.Element {
 const done=useRef(onComplete);done.current=onComplete;
 useEffect(()=>{const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const timer=window.setTimeout(()=>done.current(),reduced?0:1900);const escape=(e:KeyboardEvent):void=>{if(e.key==="Escape")done.current();};window.addEventListener("keydown",escape);return()=>{window.clearTimeout(timer);window.removeEventListener("keydown",escape);};},[]);
 return <div className={"studio-intro fixed inset-0 flex items-center justify-center "+zClass} role="status" aria-label={label}><div className="studio-intro-center"><svg className="studio-draw" viewBox="0 0 58 84" aria-hidden="true"><path d={BUDI_MARK_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" pathLength="1"/></svg><Logo variant="full" className="studio-wordmark"/><p className="studio-kicker">{subtitle}</p><h1>{word}</h1><span className="studio-intro-line"/></div><button className="studio-skip" type="button" onClick={()=>done.current()}>Skip intro ↗</button></div>;
}
