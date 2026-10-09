"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Typewriter cycler for the hero role line. Reduced-motion users get the
 * first role statically — no timers, no layout thrash.
 */
export function useTypewriter(
  words: string[],
  typeSpeed = 65,
  deleteSpeed = 35,
  pauseMs = 1700,
): { text: string; index: number } {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const key = words.join("");

  useEffect(() => {
    const list = Array.from(words);
    if (list.length === 0) return;
    if (reduced) {
      setText(list[0] ?? "");
      setIndex(0);
      return;
    }
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer = 0;

    const tick = (): void => {
      const current = list[word % list.length] ?? "";
      if (!deleting) {
        char += 1;
        setText(current.slice(0, char));
        if (char >= current.length) {
          deleting = true;
          timer = window.setTimeout(tick, pauseMs);
          return;
        }
        timer = window.setTimeout(tick, typeSpeed);
      } else {
        char -= 1;
        setText(current.slice(0, char));
        if (char <= 0) {
          deleting = false;
          word += 1;
          setIndex(word % list.length);
          timer = window.setTimeout(tick, 350);
          return;
        }
        timer = window.setTimeout(tick, deleteSpeed);
      }
    };

    timer = window.setTimeout(tick, 600);
    return (): void => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);

  return { text, index };
}
