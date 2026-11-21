"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart } from "lucide-react";

type Stored = { liked: boolean; count: number };
const keyFor = (id: string): string => `budi:like:${id}`;

/** Tactile per-project like pill with localStorage persistence + particle burst. */
export default function ProjectLike({ id, base = 0, lang }: { id: string; base?: number; lang: "en" | "fr" }): React.JSX.Element {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(base);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(id));
      if (!raw) return;
      const saved = JSON.parse(raw) as Stored;
      setLiked(Boolean(saved.liked));
      setCount(typeof saved.count === "number" ? saved.count : base + (saved.liked ? 1 : 0));
    } catch {
      /* storage blocked — keep the server-rendered count */
    }
  }, [id, base]);

  const toggle = (): void => {
    const next = !liked;
    const nextCount = base + (next ? 1 : 0);
    setLiked(next);
    setCount(nextCount);
    if (next) setBurst((value) => value + 1);
    try {
      localStorage.setItem(keyFor(id), JSON.stringify({ liked: next, count: nextCount } satisfies Stored));
    } catch {
      /* storage blocked */
    }
  };

  return (
    <button type="button" className={`cine-like${liked ? " is-liked" : ""}`} onClick={toggle} aria-pressed={liked}
      aria-label={lang === "fr" ? `Aimer ce projet · ${count}` : `Like this project · ${count}`}>
      <span className="cine-like-icon">
        <motion.span key={liked ? "on" : "off"} initial={{ scale: 0.55, rotate: -18 }} animate={{ scale: [0.55, 1.35, 1], rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 15 }}>
          <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        </motion.span>
        <AnimatePresence>
          {burst > 0 && (
            <motion.span key={burst} className="cine-like-particles" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
              {Array.from({ length: 10 }, (_, index) => {
                const angle = (index / 10) * Math.PI * 2;
                return (
                  <motion.i key={index}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: Math.cos(angle) * 27, y: Math.sin(angle) * 27, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.62, ease: "easeOut" }} />
                );
              })}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <motion.span key={count} className="cine-like-count" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}>
        {count.toLocaleString(lang)}
      </motion.span>
      <span className="cine-like-label">{lang === "fr" ? "J’aime" : "Likes"}</span>
    </button>
  );
}
