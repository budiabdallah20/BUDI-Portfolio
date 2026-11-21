"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Port = { top: number; label: string };

/**
 * The Projects deck conduit. Its travelling light is scrubbed by ScrollTrigger so
 * it is tied to real scroll progress, not a free-running CSS loop.
 */
export default function LuminousChain(): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const [ports, setPorts] = useState<Port[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    const host = track?.parentElement;
    if (!track || !host) return;

    const measure = (): void => {
      const base = host.getBoundingClientRect().top;
      const offset = 104;
      const next: Port[] = [];
      const project = document.getElementById("projects");
      if (project) next.push({ top: project.getBoundingClientRect().top - base + offset, label: lang === "fr" ? "Projets" : "Projects" });
      setPorts(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    window.addEventListener("resize", measure);

    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(track, { "--chain-progress": 0 }, {
      "--chain-progress": 1,
      ease: "none",
      scrollTrigger: { trigger: host, start: "top 78%", end: "bottom 72%", scrub: 0.45 },
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      gsap.killTweensOf(track);
    };
  }, [lang]);

  return (
    <div className="luminous-chain" ref={trackRef} aria-hidden="true">
      <span className="chain-beam" />
      <span className="chain-beam-core" />
      <span className="chain-pulse chain-pulse--lead" />
      <span className="chain-pulse chain-pulse--trail" />
      {ports.map((port, index) => (
        <span key={`${index}`} className={"chain-port chain-port--cyan"} style={{ top: port.top }}>
          <span className="chain-port-ring" />
          <span className="chain-port-label">{port.label}</span>
        </span>
      ))}
      <span className="chain-terminal chain-terminal--start" />
      <span className="chain-terminal chain-terminal--end" />
    </div>
  );
}
