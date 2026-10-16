"use client";

import { useEffect } from "react";

/** Allow the dev-overlay double-mount to re-log; real tabs log exactly once. */
let shown = false;

/**
 * Console welcome — a chic hello for anyone who opens DevTools.
 * Trilingual, enthusiastic, honest: real protections only (HTTPS/HSTS/CSP),
 * zero secrets, zero PII. Pure static strings — nothing to sanitize.
 */
export default function ConsoleWelcome(): null {
  useEffect(() => {
    if (shown) return;
    shown = true;
    // Production console stays silent — welcome branding is dev-only.
    if (process.env.NODE_ENV === "production") return;
    try {
      const big =
        "font-black font-size:28px; letter-spacing:6px; color:#ff3d00; text-shadow:0 0 18px rgba(255,61,0,.55)";
      const lime = "font-bold font-size:13px; color:#d7fd44";
      const soft = "font-size:12px; color:#a1a1aa";
      const green = "font-bold font-size:12px; color:#34d399";
      const mail = "font-size:12px; color:#38bdf8; text-decoration:underline";
      console.log("%cBUDI", big);
      console.log(
        "%cWelcome, curious mind — you found the engine room. Enjoy the tour! 🚀",
        lime,
      );
      console.log(
        "%cBienvenue — fais le tour, tout est fait avec passion. | أهلاً بيك — اتفرج واستمتع، كل حاجة معمولة بحب وشغف.",
        soft,
      );
      console.log(
        "%c🛡️ Secured: HTTPS + HSTS + CSP • anonymous stats only • your data stays yours.",
        green,
      );
      console.log(
        "%cLike what you see? Let's build something that matters → budiabdallah922@gmail.com",
        mail,
      );
    } catch {
      /* console blocked — the site stays perfect without it */
    }
  }, []);
  return null;
}
