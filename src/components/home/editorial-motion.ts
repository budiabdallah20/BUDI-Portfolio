"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useEditorialSectionTracking(
  mainRef: RefObject<HTMLElement | null>,
  headerRef: RefObject<HTMLElement | null>,
  ids: readonly string[],
  select: (anchor: string) => void,
) {
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    gsap.registerPlugin(ScrollTrigger);
    const sections = ids.flatMap(id => {
      const section = document.getElementById(id);
      return section && main.contains(section) ? [section] : [];
    });
    let frame = 0;
    let needsRefresh = false;
    let active = "";
    const update = () => {
      frame = 0;
      if (needsRefresh) {
        needsRefresh = false;
        ScrollTrigger.refresh();
      }
      const line = Math.max((headerRef.current?.getBoundingClientRect().bottom ?? 0) + 16, 116);
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top > line) break;
        current = section;
      }
      const last = sections.at(-1);
      if (last && (scrollY > 0 || location.hash === `#${last.id}`) &&
          scrollY + innerHeight >= document.documentElement.scrollHeight - 1) {
        current = last;
      }
      const anchor = current && `#${current.id}`;
      if (anchor && anchor !== active) {
        active = anchor;
        select(anchor);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const layout = new ResizeObserver(() => { needsRefresh = true; schedule(); });
    layout.observe(main);
    sections.forEach(section => layout.observe(section));
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("hashchange", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      layout.disconnect();
      removeEventListener("scroll", schedule);
      removeEventListener("hashchange", schedule);
    };
  }, [mainRef, headerRef, ids, select]);
}

export function useEditorialHero(ref: RefObject<HTMLElement | null>, ready: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !ready) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root);
      let played = false;
      const timeline = gsap.timeline({ paused: true, defaults: { duration: .48, ease: "power3.out", immediateRender: true } });
      timeline
        .from(q(".editorial-dateline > *"), { y: 9, opacity: 0, stagger: .06 }, .08)
        .from(q(".editorial-intro"), { y: 14, opacity: 0 }, .22)
        .from(q(".editorial-kinetic"), { yPercent: 70, opacity: 0, stagger: .11, duration: .61 }, .36)
        .from(q(".editorial-role-letter"), { opacity: .48, stagger: .018, duration: .42 }, .43)
        .from(q(".editorial-portrait"), { y: 20, opacity: 0, duration: .68 }, .62)
        .from(q(".editorial-chip"), { y: 8, opacity: 0, stagger: .05 }, .81)
        .from(q(".editorial-socials > a, .editorial-stats > div"), { y: 12, opacity: 0, stagger: .045 }, .94)
        .from(q(".editorial-cta"), { y: 12, opacity: 0 }, 1.15)
        .from(q(".editorial-tech"), { y: 10, opacity: 0 }, 1.35);

      const counts = root.querySelectorAll<HTMLElement>("[data-editorial-count]");
      const finishCount = (node: HTMLElement) => {
        if (node.dataset.editorialCount) node.textContent = node.dataset.editorialCount;
      };
      const started = new WeakSet<HTMLElement>();
      let statsVisible = false;
      let statsCue = false;
      const animateCounts = () => {
        if (!statsCue || !statsVisible) return;
        counts.forEach(node => {
          if (started.has(node)) return;
          started.add(node);
          gsap.fromTo(node, { textContent: 0 }, { textContent: Number(node.dataset.editorialCount), duration: .72, snap: { textContent: 1 }, ease: "power2.out" });
        });
      };
      timeline.call(() => { statsCue = true; animateCounts(); }, [], 1.04);
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === root && entry.isIntersecting && !played) {
            played = true;
            timeline.play();
            observer.unobserve(root);
          } else if (entry.target !== root && entry.isIntersecting) {
            statsVisible = true;
            animateCounts();
            observer.unobserve(entry.target);
          }
        }
      }, { threshold: .12 });
      observer.observe(root);
      const stats = root.querySelector(".editorial-stats");
      if (stats) observer.observe(stats);

      const cover = root.querySelector<HTMLElement>(".editorial-cover");
      const heading = root.querySelector<HTMLElement>(".editorial-cover h1");
      const portrait = root.querySelector<HTMLElement>(".editorial-portrait-plane");
      const photo = portrait?.querySelector("img");
      const chip = root.querySelector<HTMLElement>(".editorial-chip-drift");
      const orbit = root.querySelector<HTMLElement>(".editorial-portrait-orbit i:first-child");
      const light = root.querySelector<HTMLElement>(".editorial-portrait-light");
      const fine = matchMedia("(pointer: fine) and (hover: hover)");
      const titleX = heading && gsap.quickTo(heading, "x", { duration: .48 });
      const spring = { duration:.7, ease:"back.out(1.13)" };
      if (portrait) gsap.set(portrait,{transformPerspective:1050});
      const portraitX = portrait && gsap.quickTo(portrait, "x", spring);
      const portraitY = portrait && gsap.quickTo(portrait, "y", spring);
      const pitch = portrait && gsap.quickTo(portrait, "rotationX", spring);
      const yaw = portrait && gsap.quickTo(portrait, "rotationY", spring);
      const chipX = chip && gsap.quickTo(chip, "x", { duration: .47 });
      const orbitY = orbit && gsap.quickTo(orbit, "y", { duration: .7 });
      const lightX = light && gsap.quickTo(light, "x", { duration: .75 });
      const lightY = light && gsap.quickTo(light, "y", { duration: .75 });
      const idle = photo && gsap.to(photo,{y:-4,duration:3.8,yoyo:true,repeat:-1,ease:"sine.inOut",paused:true});
      const visibility = new IntersectionObserver(([entry]) => {
        if(entry.isIntersecting && fine.matches) idle?.resume();
        else idle?.pause();
      },{threshold:.2});
      if(cover) visibility.observe(cover);
      let bounds: DOMRect | undefined;
      const enter = () => { bounds = cover?.getBoundingClientRect(); };
      const move = (event: PointerEvent) => {
        if (!bounds || !fine.matches || event.pointerType !== "mouse") return;
        const unit = (v: number) => gsap.utils.clamp(-1, 1, v);
        const x = unit((event.clientX - bounds.left) / bounds.width * 2 - 1);
        const y = unit((event.clientY - bounds.top) / bounds.height * 2 - 1);
        titleX?.(-x * 4);
        portraitX?.(x * 11);
        portraitY?.(y * 8);
        pitch?.(-y * 2.3);
        yaw?.(x * 2.4);
        chipX?.(x * 6);
        orbitY?.(y * 6);
        lightX?.(x * 18);
        lightY?.(y * 10);
      };
      const reset = () => {
        bounds = undefined;
        titleX?.(0);
        portraitX?.(0);
        portraitY?.(0);
        pitch?.(0);
        yaw?.(0);
        chipX?.(0);
        orbitY?.(0);
        lightX?.(0);
        lightY?.(0);
      };
      cover?.addEventListener("pointerenter", enter);
      cover?.addEventListener("pointermove", move);
      cover?.addEventListener("pointerleave", reset);

      const magnets = Array.from(root.querySelectorAll<HTMLAnchorElement>(".editorial-socials a, .editorial-resume")).map(link => {
        const body = link.querySelector(".editorial-social-body, .editorial-magnet-body");
        if (!body) return () => undefined;
        const x = gsap.quickTo(body, "x", { duration: .42, ease: "back.out(1.22)" });
        const y = gsap.quickTo(body, "y", { duration: .42, ease: "back.out(1.22)" });
        let box: DOMRect;
        const begin = () => { box = link.getBoundingClientRect(); };
        const follow = (event: PointerEvent) => {
          if (!box || !fine.matches || event.pointerType !== "mouse") return;
          x(gsap.utils.clamp(-4, 4, (event.clientX - box.left - box.width / 2) * .09));
          y(gsap.utils.clamp(-3, 3, (event.clientY - box.top - box.height / 2) * .12));
        };
        const end = () => { x(0); y(0); };
        link.addEventListener("pointerenter", begin);
        link.addEventListener("pointermove", follow);
        link.addEventListener("pointerleave", end);
        return () => {
          link.removeEventListener("pointerenter", begin);
          link.removeEventListener("pointermove", follow);
          link.removeEventListener("pointerleave", end);
        };
      });
      return () => {
        observer.disconnect();
        visibility.disconnect();
        idle?.kill();
        timeline.kill();
        gsap.killTweensOf(Array.from(counts));
        counts.forEach(finishCount);
        cover?.removeEventListener("pointerenter", enter);
        cover?.removeEventListener("pointermove", move);
        cover?.removeEventListener("pointerleave", reset);
        magnets.forEach(remove => remove());
      };
    });
    return () => media.revert();
  }, [ready, ref]);
}

export function useEditorialWorkAnchor(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let previous: HTMLElement | null = null;

    const focusProof = (smooth: boolean) => {
      cancelAnimationFrame(frame);
      previous?.removeAttribute("data-atelier-target");
      previous = null;
      if (!location.hash.startsWith("#work-")) return;
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(location.hash.slice(1));
        if (!target?.closest("#projects, #skills")) return;
        target.setAttribute("data-atelier-target", "");
        previous = target;
        const top = target.getBoundingClientRect().top;
        if (top < 72 || top >= window.innerHeight - 32) {
          const noMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top: window.scrollY + top - 96, behavior: smooth && !noMotion ? "smooth" : "instant" });
        }
        target.focus({ preventScroll: true });
      });
    };

    const onHash = () => focusProof(true);
    focusProof(false);
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(frame);
      previous?.removeAttribute("data-atelier-target");
      window.removeEventListener("hashchange", onHash);
    };
  }, [enabled]);
}
