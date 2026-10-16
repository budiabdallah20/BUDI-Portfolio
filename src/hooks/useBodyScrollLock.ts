"use client";

import { useEffect, useRef } from "react";

/**
 * Central body-scroll lock + Escape-stack manager.
 *
 * WHY THIS EXISTS — the old pattern in every modal was:
 *   const prev = body.overflow; body.overflow = "hidden"; ... body.overflow = prev;
 * With two stacked layers (Projects dossier + image preview, Certificates
 * dossier + lightbox, menu + command palette) the inner layer saved "hidden"
 * as its `prev`. Closing both at once (one shared Escape press) restored in
 * whatever order React ran cleanups — and the page could stay `hidden`
 * forever: background scroll dead until reload.
 *
 * The counter fixes it: the FIRST locker hides, the LAST unlocker restores.
 * The Escape stack fixes the rest: only the TOPMOST layer closes per press,
 * so stacked modals peel off one by one instead of racing each other.
 */

let locks = 0;
let savedOverflow = "";
const escapeStack: Array<() => void> = [];

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

/** Imperative lock — returns an idempotent release function. */
export function lockBodyScroll(): () => void {
  if (!isBrowser()) return () => undefined;
  if (locks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0 && isBrowser()) {
      document.body.style.overflow = savedOverflow;
    }
  };
}

/** Declarative lock — holds `hidden` while `active`, restores when the last holder leaves. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const release = lockBodyScroll();
    return release;
  }, [active]);
}

/**
 * Topmost-wins Escape: with stacked layers only the last-opened one closes
 * per Escape press. `onClose` identity is irrelevant (kept in a ref), so
 * inline `() => setX(null)` callbacks are safe and never re-subscribe.
 */
export function useTopmostEscape(active: boolean, onClose: () => void): void {
  const cbRef = useRef(onClose);
  cbRef.current = onClose;
  useEffect(() => {
    if (!active || !isBrowser()) return;
    const entry = (): void => {
      cbRef.current();
    };
    escapeStack.push(entry);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && escapeStack[escapeStack.length - 1] === entry) {
        entry();
      }
    };
    document.addEventListener("keydown", onKey);
    return (): void => {
      document.removeEventListener("keydown", onKey);
      const i = escapeStack.lastIndexOf(entry);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, [active]);
}
