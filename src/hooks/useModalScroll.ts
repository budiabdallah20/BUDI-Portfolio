"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

/**
 * useModalScroll — makes any modal/lightbox body keyboard-scrollable.
 * Focus lands inside the scrollable panel on open, and arrows / space /
 * PageUp / PageDown / Home / End always scroll it — even when the page
 * behind is locked and focus started on a button.
 */
export function useModalScroll<T extends HTMLElement>(open: boolean): {
  ref: React.RefObject<T | null>;
  onKeyDown: (e: KeyboardEvent<T>) => void;
} {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* older browsers */
    }
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const page = Math.max(el.clientHeight * 0.85, 120);
      switch (e.key) {
        case "ArrowDown":
          el.scrollBy({ top: 120 });
          e.preventDefault();
          break;
        case "ArrowUp":
          el.scrollBy({ top: -120 });
          e.preventDefault();
          break;
        case "ArrowLeft":
          el.scrollBy({ left: -120 });
          e.preventDefault();
          break;
        case "ArrowRight":
          el.scrollBy({ left: 120 });
          e.preventDefault();
          break;
        case "PageDown":
        case " ":
          el.scrollBy({ top: page, behavior: "smooth" });
          e.preventDefault();
          break;
        case "PageUp":
          el.scrollBy({ top: -page, behavior: "smooth" });
          e.preventDefault();
          break;
        case "Home":
          el.scrollTo({ top: 0, behavior: "smooth" });
          e.preventDefault();
          break;
        case "End":
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          e.preventDefault();
          break;
      }
    },
    [],
  );

  return { ref, onKeyDown };
}
