"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUDI_MARK_PATH,BUDI_WORDMARK_PATH } from "@/lib/brand";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { lockBodyScroll } from "@/hooks/useBodyScrollLock";
export default function LoadingScreen({onComplete}:{onComplete:()=>void}):React.JSX.Element {
 const {t}=useLanguage(); const done=useRef(onComplete); done.current=onComplete;
 const [leaving,setLeaving]=useState(false);const timer=useRef<number|undefined>(undefined);const finished=useRef(false);
 const finish=useCallback(()=>{if(finished.current)return;finished.current=true;setLeaving(true);timer.current=window.setTimeout(()=>done.current(),window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:240);},[]);
 useEffect(()=>{finished.current=false;const release=lockBodyScroll();const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const fallback=window.setTimeout(finish,reduced?0:2400);const key=(e:KeyboardEvent)=>{if(e.key==="Escape")finish();};window.addEventListener("keydown",key);return()=>{release();clearTimeout(fallback);clearTimeout(timer.current);window.removeEventListener("keydown",key);};},[finish]);
 return <div data-loader-root="site" className={"brand-intro "+(leaving?"brand-intro--leaving":"")} aria-label="BUDI introduction"><div className="brand-intro-art"><svg className="brand-intro-mark" viewBox="0 0 58 84" aria-hidden="true"><path d={BUDI_MARK_PATH} pathLength="1" fillRule="evenodd"/></svg><svg className="brand-intro-word" viewBox="0 0 114 72" role="img" aria-label="BUDI"><path d={BUDI_WORDMARK_PATH} fillRule="evenodd"/></svg><p className="brand-intro-caption">DESIGN. BUILD. CONNECT.</p></div><button type="button" onClick={finish} className="brand-intro-skip">{t.loader.skip} ↗</button></div>;
}
