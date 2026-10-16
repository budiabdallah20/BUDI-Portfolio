"use client";

import { useEffect } from "react";

/**
 * PWA bootstrap — registers /sw.js once (prod only, secure contexts),
 * captures the install prompt for the dashboard install button.
 */
export default function PwaRegister(): React.JSX.Element | null {
  useEffect(() => {
    try {
      const onPrompt = (e: Event): void => {
        e.preventDefault();
        (window as unknown as { __budiInstallPrompt?: Event }).__budiInstallPrompt = e;
        window.dispatchEvent(new CustomEvent("budi:installable"));
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      if ("serviceWorker" in navigator && window.isSecureContext) {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }
      return (): void => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    } catch {
      return undefined;
    }
  }, []);
  return null;
}
