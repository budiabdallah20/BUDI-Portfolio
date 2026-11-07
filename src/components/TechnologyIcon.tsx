"use client";
import { useState } from "react";
import { canonicalTechnology } from "@/lib/skill-usage";
const local: Record<string,string> = { microsoftexcel:"excel",excel:"excel",microsoftpowerpoint:"powerpoint",powerpoint:"powerpoint",react:"react", next:"nextjs", typescript:"typescript", javascript:"javascript", tailwind:"tailwind", html:"html", css:"css", gsap:"gsap", motion:"framer", node:"nodejs", "git-github":"git", git:"git", github:"git", figma:"figma" };
export default function TechnologyIcon({name,src}: {name:string;src?:string}): React.JSX.Element {
 const [failed,setFailed]=useState(false); const file=local[canonicalTechnology(name)]; const source=file ? "/icons/tech/"+file+".svg" : src;
 if(!source || failed) return <span aria-hidden="true" className="font-mono text-sm font-bold">{name.slice(0,2).toUpperCase()}</span>;
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={source} width={30} height={30} loading="eager" alt="" className="h-[30px] w-[30px] object-contain" onError={()=>setFailed(true)}/>;
}
