"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Routes measured from actual exhibit bounds; all linework stays in gutters. */
export default function EngravedPath({ children, className, activeKey, color = "#F2C94C" }: {
  children: ReactNode; className: string; activeKey?: string | null; color?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [routes, setRoutes] = useState<{ key: string; neighbor: string; d: string }[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cards = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-exhibit-key]"));
        const rtl = getComputedStyle(el).direction === "rtl";
        const edge = rtl ? el.clientWidth - 4 : 4;
        const next = cards.slice(1).map((card, index) => {
          const previous = cards[index];
          const x = card.offsetLeft + card.offsetWidth / 2;
          const fromX = previous.offsetLeft + previous.offsetWidth / 2;
          const y = card.offsetTop - 9;
          const fromY = previous.offsetTop - 9;
          const sameRow = Math.abs(y - fromY) < 32;
          const gutter = Math.min(y, fromY) - 7;
          const stem = sameRow
            ? `V ${gutter} H ${x} V ${y}`
            : `V ${fromY - 7} H ${edge} V ${y - 7} H ${x} V ${y}`;
          const node = (cx: number, cy: number) => `M ${cx} ${cy - 3} l 3 3 -3 3 -3 -3 Z`;
          return { key: card.dataset.exhibitKey!, neighbor: previous.dataset.exhibitKey!, d: `M ${fromX} ${fromY} ${stem} ${node(fromX, fromY)} ${node(x, y)}` };
        });
        setRoutes(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      });
    };
    const resize = new ResizeObserver(measure);
    const observe = () => { resize.observe(el); el.querySelectorAll<HTMLElement>(":scope > [data-exhibit-key]").forEach(card => resize.observe(card)); measure(); };
    const mutation = new MutationObserver(observe);
    mutation.observe(el, { childList: true }); observe();
    return () => { resize.disconnect(); mutation.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={root} className={className} style={{ "--path-color": color } as React.CSSProperties}>
    <svg className="etched-routes" aria-hidden="true" width="100%" height="100%">
      {routes.map(route => <path key={route.key} d={route.d} pathLength={1} className={(activeKey === route.key || activeKey === route.neighbor) ? "is-active" : undefined}/>)}
    </svg>
    {children}
  </div>;
}
