"use client";

import { useEffect, useRef, useState } from "react";

type Connection = { from: string; to: string; path: string; end: [number, number] };

function measureConnections(grid: HTMLElement) {
  const base = grid.getBoundingClientRect();
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > .work-card:not([hidden])"));
  const boxes = cards.map(card => card.getBoundingClientRect());
  return cards.slice(1).map((card, index): Connection => {
    const previous = boxes[index];
    const next = boxes[index + 1];
    let start: [number, number];
    let end: [number, number];
    let path: string;

    if (Math.abs(previous.top - next.top) < 2) {
      const forwards = next.left > previous.left;
      const y = Math.min(previous.bottom, next.bottom) - base.top - 32;
      start = [(forwards ? previous.right + 1 : previous.left - 1) - base.left, y];
      end = [(forwards ? next.left - 1 : next.right + 1) - base.left, y];
      path = `M ${start.join(" ")} H ${end[0]}`;
    } else {
      start = [previous.left + previous.width / 2 - base.left, previous.bottom - base.top + 1];
      end = [next.left + next.width / 2 - base.left, next.top - base.top - 1];
      const middle = (start[1] + end[1]) / 2;
      path = `M ${start.join(" ")} V ${middle} H ${end[0]} V ${end[1]}`;
    }

    return { from: cards[index].id, to: card.id, path, end };
  });
}

export function ProjectChain({ layoutKey }: { layoutKey: string }) {
  const track = useRef<SVGSVGElement>(null);
  const revealed = useRef(new WeakSet<Element>());
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    const grid = track.current?.parentElement;
    if (!grid) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setConnections(measureConnections(grid)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    grid.querySelectorAll(":scope > .work-card:not([hidden])").forEach(card => observer.observe(card));
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [layoutKey]);

  useEffect(() => {
    const root = track.current;
    const grid = root?.parentElement;
    if (!grid || !root || !connections.length) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let animation: Animation | undefined;
    let nodeAnimation: Animation | undefined;
    let cardAnimation: Animation | undefined;
    const play = (card?: string) => {
      if (!motion.matches) return;
      const outgoing = card ? connections.findIndex(connection => connection.from === card) : 0;
      const index = outgoing >= 0 ? outgoing : connections.findIndex(connection => connection.to === card);
      const group = root.children[index];
      if (!group) return;
      animation?.cancel();
      nodeAnimation?.cancel();
      cardAnimation?.cancel();
      animation = group.querySelector(".work-chain-pulse")?.animate([
        { strokeDashoffset: ".14", opacity: 0 },
        { opacity: 1, offset: .15 },
        { strokeDashoffset: "-1", opacity: 0 },
      ], { duration: 760, easing: "ease-out" });
      nodeAnimation = group.querySelector("circle")?.animate([
        { opacity: .58 }, { opacity: 1, offset: .8 }, { opacity: .58 },
      ], { duration: 960, easing: "ease-out" });
      cardAnimation = document.getElementById(connections[index].to)?.animate([
        { boxShadow: "0 0 0 1px #d8b47700" },
        { boxShadow: "0 0 0 1px #d8b4779c", offset: .72 },
        { boxShadow: "0 0 0 1px #d8b47700" },
      ], { duration: 1050, easing: "ease-out" });
    };
    const interact = (event: Event) => {
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".work-card") : null;
      const related = (event as MouseEvent | FocusEvent).relatedTarget;
      if (card && !(related instanceof Node && card.contains(related))) play(card.id);
    };
    const appear = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting && !revealed.current.has(entry.target));
      if (!entering.length) return;
      for (const entry of entering) {
        revealed.current.add(entry.target);
        appear.unobserve(entry.target);
      }
      if (animation?.playState !== "running") play(entering[0].target.id);
    }, { threshold: .32 });
    grid.querySelectorAll(".work-card:not([hidden])").forEach(card => {
      if (!revealed.current.has(card)) appear.observe(card);
    });
    grid.addEventListener("pointerover", interact);
    grid.addEventListener("focusin", interact);
    return () => {
      appear.disconnect();
      grid.removeEventListener("pointerover", interact);
      grid.removeEventListener("focusin", interact);
      animation?.cancel();
      nodeAnimation?.cancel();
      cardAnimation?.cancel();
    };
  }, [connections]);

  return (
    <svg ref={track} className="work-chain" aria-hidden="true" focusable="false">
      {connections.map(({ from, to, path, end }) => (
        <g key={from + ":" + to}>
          <path className="work-chain-track" d={path} />
          <path className="work-chain-pulse" d={path} pathLength={1} />
          <circle cx={end[0]} cy={end[1]} r={1.8} />
        </g>
      ))}
    </svg>
  );
}
