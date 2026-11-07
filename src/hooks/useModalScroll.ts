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
    const previous = document.activeElement;
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* older browsers */
    }
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      if (e.key === "Tab") {
        const targets = Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(n => n.getClientRects().length > 0);
        const first = targets[0]; const last = targets[targets.length - 1];
        if (!first) { e.preventDefault(); el.focus(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === el)) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
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
          el.scrollBy({ top: page, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          e.preventDefault();
          break;
        case "PageUp":
          el.scrollBy({ top: -page, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          e.preventDefault();
          break;
        case "Home":
          el.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          e.preventDefault();
          break;
        case "End":
          el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
          e.preventDefault();
          break;
      }
    },
    [],
  );

  return { ref, onKeyDown };
}
