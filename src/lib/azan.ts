"use client";

/**
 * Azan + local notification helpers (dashboard only).
 *
 * Azan: plays `/audio/azan.mp3` clipped to ~5 seconds (drop YOUR file —
 * e.g. Sheikh Abdul Basit Abdul Samad — at public/audio/azan.mp3).
 * If the file is missing, a soft 5s chime pattern plays instead so the
 * reminder moment still feels special. Nothing throws, ever.
 */

let azanCache: HTMLAudioElement | null = null;
let azanMissing = false;

function fallbackChime(seconds = 5): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const endAt = ctx.currentTime + seconds;
    // Gentle ascending chime, one soft bell per second.
    for (let i = 0; i < seconds; i += 1) {
      const t = ctx.currentTime + i;
      if (t > endAt) break;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 523.25 * Math.pow(2, (i % 4) / 12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
    }
    window.setTimeout(() => void ctx.close().catch(() => undefined), (seconds + 1) * 1000);
  } catch {
    /* audio unsupported */
  }
}

/** Play ~5 seconds of the azan (file or fallback chime). */
export function playAzan5s(): void {
  try {
    if (azanMissing) {
      fallbackChime(5);
      return;
    }
    if (!azanCache) {
      const audio = new Audio("/audio/azan.mp3");
      audio.preload = "auto";
      azanCache = audio;
    }
    const audio = azanCache;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      azanMissing = true;
      fallbackChime(5);
    });
    audio.onended = null;
    window.setTimeout(() => {
      try {
        if (!audio.paused) {
          // Gentle 0.6s fade instead of a hard cut.
          const step = (): void => {
            if (audio.volume > 0.08) {
              audio.volume = Math.max(0, audio.volume - 0.08);
              window.setTimeout(step, 50);
            } else {
              audio.pause();
              audio.volume = 1;
            }
          };
          step();
        } else {
          audio.volume = 1;
        }
      } catch {
        /* ignore */
      }
    }, 5000);
  } catch {
    fallbackChime(5);
  }
}

/** Fire a local notification if permission was granted. */
export function localNotify(title: string, body: string, tag: string, url = "/admin"): void {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const options = {
      body,
      icon: "/icons/pwa-192.png",
      badge: "/icons/pwa-192.png",
      tag,
      renotify: true,
    } as NotificationOptions;
    const n = new Notification(title, options);
    n.onclick = (): void => {
      try {
        window.focus();
        if (url !== window.location.pathname) window.location.href = url;
      } catch {
        /* ignore */
      }
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function notificationsSupported(): boolean {
  try {
    return "Notification" in window;
  } catch {
    return false;
  }
}
