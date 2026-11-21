"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function StudioMotion({ ready }: { ready: boolean }) {
  const light = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = light.current;
    const content = document.getElementById("content");
    if (!ready || !stage || !content) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 1101px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to(stage, {
        yPercent: 21,
        xPercent: -9,
        ease: "none",
        scrollTrigger: { trigger: content, start: "top top", end: "bottom bottom", scrub: true },
      });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Keep the reveal subtle and preserve visibility while deep-linking.
      content.querySelectorAll<HTMLElement>(".museum-section-heading, #contact-heading").forEach(heading => {
        if (heading.getBoundingClientRect().top < window.innerHeight) return;
        gsap.from(heading, {
          y: 14,
          opacity: 0.65,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: { trigger: heading, start: "top 92%", once: true },
        });
      });
    });
    return () => media.revert();
  }, [ready]);

  return <div ref={light} className="studio-light" aria-hidden="true" />;
}
