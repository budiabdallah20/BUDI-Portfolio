"use client";

import { useEffect, useRef } from "react";

/**
 * ErrorReporter — throttled site-error beacon for the owner's inbox.
 * Listens to window error + unhandledrejection once per session hit
 * (server dedupes globally to one stored error per 10 min).
 */
export default function ErrorReporter(): React.JSX.Element | null {
  const sentRef = useRef(false);

  useEffect(() => {
    const report = (message: string): void => {
      if (sentRef.current) return;
      sentRef.current = true;
      try {
        const payload = JSON.stringify({
          message: message.slice(0, 200),
          where: window.location.pathname.slice(0, 120),
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/notify/error", blob);
        } else {
          void fetch("/api/notify/error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch {
        /* never break the page */
      }
    };
    const onError = (e: ErrorEvent): void => {
      if (e.message) report(e.message);
    };
    const onRejection = (e: PromiseRejectionEvent): void => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
      if (msg) report(`Unhandled: ${msg}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return (): void => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
