"use client";

import { useEffect } from "react";

/** Shape of the Chromium install event we stash for the banner + dashboard. */
export interface BudiInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __budiInstallPrompt?: BudiInstallEvent;
  }
}

/** The service worker is a production-only concern. */
const SW_ENABLED = process.env.NODE_ENV === "production";

/** Drop every Cache Storage bucket this origin owns (best-effort). */
function purgeCaches(): void {
  if (typeof caches === "undefined") return;
  void caches
    .keys()
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .catch(() => undefined);
}

/**
 * PWA bootstrap + install-prompt capture.
 *
 * PRODUCTION — registers /sw.js once (secure contexts only) and captures the
 * install prompt for the on-site install banner and the dashboard button.
 *
 * DEVELOPMENT — registers nothing and actively tears down any worker (and
 * Cache Storage) a previous session left behind. `http://localhost` counts as
 * a secure context, so the old unconditional registration ran the production
 * worker against the dev server: its cache-first "/" document and cache-first
 * dev chunks kept painting a stale build, every recompile 404'd the old hashed
 * chunks, and the recovery/reload path plus Fast Refresh turned into an endless
 * refresh storm. The worker buys nothing in dev — no push, no offline — only
 * stale bytes.
 *
 * We deliberately DO NOT call `preventDefault()` on `beforeinstallprompt`:
 * preventing it — and then never calling `prompt()` — is exactly what makes
 * Chrome log "Banner not shown: …the page must call prompt()". Keeping the
 * default lets Chromium keep its own install affordances, and our banner
 * still calls `prompt()` on a real user gesture.
 */
export default function PwaRegister(): React.JSX.Element | null {
  useEffect(() => {
    const timers: number[] = [];
    try {
      const onPrompt = (event: Event): void => {
        window.__budiInstallPrompt = event as BudiInstallEvent;
        window.dispatchEvent(new CustomEvent("budi:installable"));
      };
      const onInstalled = (): void => {
        window.__budiInstallPrompt = undefined;
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      window.addEventListener("appinstalled", onInstalled);

      if ("serviceWorker" in navigator) {
        if (SW_ENABLED && window.isSecureContext) {
          void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        } else {
          // Dev (or an insecure origin): evict anything a previous session
          // cached, so the browser is back to a plain, always-fresh dev server.
          void navigator.serviceWorker
            .getRegistrations()
            .then((regs) => Promise.all(regs.map((reg) => reg.unregister().catch(() => undefined))))
            .catch(() => undefined);
          purgeCaches();
          // A worker that is still controlling this document can keep writing
          // to Cache Storage for a beat after unregister() — sweep again.
          timers.push(window.setTimeout(purgeCaches, 1500));
        }
      }

      return (): void => {
        for (const id of timers) window.clearTimeout(id);
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.removeEventListener("appinstalled", onInstalled);
      };
    } catch {
      return undefined;
    }
  }, []);
  return null;
}
