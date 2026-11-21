"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useStudioReveal(view = "") {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
      const deck = section.querySelector(".p1-deck-stage");
      const backing = section.querySelector(".p1-deck-back");
      if (!deck || !backing) return;
      gsap.fromTo(backing, { y: -9 }, {
        y: 0,
        ease: "none",
        scrollTrigger: { trigger: deck, start: "top bottom", end: "top 30%", scrub: true },
      });
    });
    media.add("(prefers-reduced-motion: no-preference)", () => {
      section.querySelectorAll<HTMLElement>("[data-p1-shot], [data-p1-reveal]").forEach(element => {
        const shot = element.hasAttribute("data-p1-shot");
        const heading = element.classList.contains("p1-heading");
        gsap.from(heading ? Array.from(element.children) : element, {
          y: shot ? 19 : 26,
          opacity: shot ? 0.42 : 0.55,
          delay: shot || heading ? 0 : 0.11,
          duration: shot ? 0.95 : 0.78,
          ease: "power2.out",
          stagger: heading ? 0.14 : 0,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: element,
            start: "top 94%",
            once: true,
            onEnter: () => element.classList.add("p1-entered"),
          },
        });
      });
    });
    return () => media.revert();
  }, [view]);
  return root;
}

const pending = new WeakSet<HTMLElement>();

export function spotlight(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
  const { currentTarget: card, clientX, clientY } = event;
  if (pending.has(card)) return;
  pending.add(card);
  requestAnimationFrame(() => {
    pending.delete(card);
    if (!card.isConnected) return;
    const bounds = card.getBoundingClientRect();
    const x = `${clientX - bounds.left}px`;
    const y = `${clientY - bounds.top}px`;
    card.style.setProperty("--p1-x", x);
    card.style.setProperty("--p1-y", y);
    // Cinematic cards read the same pointer through the generic spotlight vars.
    card.style.setProperty("--mouse-x", x);
    card.style.setProperty("--mouse-y", y);
  });
}
