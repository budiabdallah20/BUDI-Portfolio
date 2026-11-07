"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
/** Realtime is optional: polling remains active even if its setup fails. */
export default function RealtimeRefresh(): null {
 const router=useRouter();const fingerprint=useRef<string|null>(null);
 useEffect(()=>{
  let stopped=false,inFlight=false,timer=0; let unsubscribe:(()=>void)|undefined;
  const controller=new AbortController();
  const check=async ():Promise<void>=>{
   if(stopped||inFlight||document.visibilityState!=="visible")return;
   inFlight=true;
   try{
    const res=await fetch("/api/content-hash",{cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
    if(!res.ok||stopped)return;
    const json=await res.json() as {at?:string;counts?:object;likes?:number;preview?:string};
    const next=JSON.stringify([json.at,json.counts,json.likes,json.preview]);
    if(fingerprint.current!==null&&next!==fingerprint.current){window.clearTimeout(timer);timer=window.setTimeout(()=>{if(!stopped)router.refresh();},350);}
    fingerprint.current=next;
   }catch{/* Retry on the next poll; never replace good content with an error. */}finally{inFlight=false;}
  };
  const poller=window.setInterval(()=>void check(),2500);
  const onFocus=():void=>{void check();};
  document.addEventListener("visibilitychange",onFocus);window.addEventListener("focus",onFocus);void check();
  try{
   const sb=supabaseBrowser();let channel=sb.channel("site-content");
   for(const table of ["services","skills","projects","certs","settings","likes"]){channel=channel.on("postgres_changes",{event:"*",schema:"public",table},()=>void check());}
   channel.subscribe();unsubscribe=()=>{void sb.removeChannel(channel);};
  }catch{/* The independent poller continues. */}
  return()=>{stopped=true;controller.abort();window.clearInterval(poller);window.clearTimeout(timer);document.removeEventListener("visibilitychange",onFocus);window.removeEventListener("focus",onFocus);unsubscribe?.();};
 },[router]);return null;
}
