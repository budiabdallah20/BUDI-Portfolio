"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  Cake,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock,
  Crown,
  Flame,
  Gift,
  Heart,
  HeartHandshake,
  Lock,
  MapPin,
  Music,
  PartyPopper,
  Quote,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useNow } from "@/hooks/useNow";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  daysUntilBirthday,
  hasBirthdayPreview,
  isBirthday,
  nextBirthdayStartMs,
  splitCountdown,
} from "@/lib/birthday";
import { profile, stackChips } from "@/data/portfolio";
import {
  ANTHEM_CHORUS_AR,
  ANTHEM_CHORUS_EN,
  ANTHEM_VERSES,
  BIRTH_DAY,
  BIRTH_MONTH,
  BIRTH_YEAR,
  DEFAULT_WISHES,
  FUEL_QUOTES,
  TIMELINE,
  VAULT_PHOTOS,
} from "@/data/birthday";

/* ------------------------------------------------------------------ */
/* Confetti — dependency-free canvas burst, motion-safe               */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ["#ff3d00", "#d7fd44", "#a78bfa", "#38bdf8", "#f9edb0", "#34d399"];

/** The AI anthem film. Deploy it to public/videos/birthday.mp4 AND set
 *  public/videos/manifest.json → { "birthday": true }. Both are required;
 *  the flag without the file falls back to the cinema show. */
const VIDEO_SRC = "/videos/birthday.mp4";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
}

function useConfetti(enabled: boolean): { ref: React.RefObject<HTMLCanvasElement | null>; burst: () => void } {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const parts = useRef<Particle[]>([]);
  const reduced = useReducedMotion();
  /** Logical (CSS-pixel) size. The backing store is DPR-scaled, so the
   *  physics must never read canvas.width/height directly or everything
   *  would fall off-screen twice as fast on a retina display. */
  const size = useRef({ w: 0, h: 0 });

  /** Match the backing store to the display density without blurring. */
  const resize = (): boolean => {
    const canvas = ref.current;
    if (!canvas) return false;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    size.current = { w, h };
    return true;
  };

  const burst = useCallback(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    if (!resize()) return;
    const { w, h } = size.current;
    for (let i = 0; i < 160; i += 1) {
      parts.current.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h * 0.32,
        vx: (Math.random() - 0.5) * 11,
        vy: Math.random() * -9 - 2,
        w: 5 + Math.random() * 7,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        life: 1,
      });
    }
  }, [reduced]);

  useEffect(() => {
    if (!enabled || reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!resize()) return;
    let raf = 0;
    const tick = (): void => {
      raf = window.requestAnimationFrame(tick);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.current.w, size.current.h);
      // Compact in place. The previous version did
      // `parts.current = parts.current.filter(...)`, which allocated a brand
      // new array of up to 160 objects on EVERY frame — 60 allocations/sec of
      // garbage that the GC then had to chase while the animation was trying
      // to hold 60fps. Writing survivors back into the same array costs
      // nothing and keeps the particle count honest.
      const arr = parts.current;
      let write = 0;
      for (let read = 0; read < arr.length; read += 1) {
        const p = arr[read]!;
        p.vy += 0.22;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        if (p.life <= 0 || p.y > size.current.h + 30) continue; // dropped
        arr[write] = p;
        write += 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      arr.length = write;
    };
    tick();
    const opener = window.setTimeout(burst, 450);
    const onResize = (): void => {
      resize();
    };
    window.addEventListener("resize", onResize);
    return (): void => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(opener);
      window.removeEventListener("resize", onResize);
      parts.current = [];
    };
  }, [enabled, burst, reduced, resize]);

  return { ref, burst };
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function Eyebrow({ icon, text }: { icon: React.ReactNode; text: string }): React.JSX.Element {
  return (
    <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.3em] text-[#e9ce7a] uppercase">
      {icon}
      {text}
    </p>
  );
}

function SectionTitle({ ar, en }: { ar: string; en: string }): React.JSX.Element {
  return (
    <div className="text-center">
      <p dir="rtl" lang="ar" className="font-display text-2xl font-black text-foreground sm:text-3xl">
        {ar}
      </p>
      <p className="mt-1 font-mono text-[11px] tracking-[0.35em] text-[#d4af37] uppercase">{en}</p>
    </div>
  );
}

const GREETINGS: { text: string; dir: "ltr" | "rtl"; lang: string }[] = [
  { text: "Happy Birthday, BUDI — 20 years of becoming.", dir: "ltr", lang: "en" },
  { text: "Joyeux anniversaire — que cette année compile sans erreurs.", dir: "ltr", lang: "fr" },
  { text: "عيد ميلاد سعيد يا بودي — عشرين سنة عظمة، واللي جاي أعظم.", dir: "rtl", lang: "ar" },
  { text: "From Suez to the world — the vault is open.", dir: "ltr", lang: "en" },
  { text: "استمر… ربنا شايف سعيك وهيكافئك.", dir: "rtl", lang: "ar" },
];

function Typewriter(): React.JSX.Element {
  const [gi, setGi] = useState(0);
  const [chars, setChars] = useState(0);
  useEffect(() => {
    const full = GREETINGS[gi % GREETINGS.length]!.text;
    if (chars < full.length) {
      const id = window.setTimeout(() => setChars((c) => c + 1), 32);
      return (): void => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setGi((g) => g + 1);
      setChars(0);
    }, 3200);
    return (): void => window.clearTimeout(id);
  }, [gi, chars]);
  const g = GREETINGS[gi % GREETINGS.length]!;
  return (
    <p dir={g.dir} lang={g.lang} className="min-h-14 text-center text-lg leading-relaxed text-foreground sm:text-xl">
      {g.text.slice(0, chars)}
      <span aria-hidden="true" className="bday-caret ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 bg-accent" />
    </p>
  );
}

function useAgeOnBirthday(): { years: number; daysLived: number; hoursLived: number } {
  return useMemo(() => {
    const now = new Date();
    const cairoYear = Number(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric" }).format(now),
    );
    const years = cairoYear - BIRTH_YEAR;
    const start = Date.UTC(BIRTH_YEAR, BIRTH_MONTH - 1, BIRTH_DAY);
    const end = Date.UTC(cairoYear, BIRTH_MONTH - 1, BIRTH_DAY);
    const daysLived = Math.max(0, Math.floor((end - start) / 86_400_000));
    return { years: Math.max(0, years), daysLived, hoursLived: daysLived * 24 };
  }, []);
}

/* ------------------------------------------------------------------ */
/* AI Anthem film — video when present, lyric cinema otherwise        */
/* ------------------------------------------------------------------ */

function CinemaShow(): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  const [verse, setVerse] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  /**
   * Celebratory pentatonic motif synthesised in the browser — no asset, no
   * autoplay policy fight.
   *
   * FIX: every oscillator used to be created and connected but never
   * disconnected. Web Audio keeps a live node (and its gain stage) in the
   * graph until it is released, so a few dozen taps on this button slowly
   * loaded the audio thread with dead nodes until playback started to crackle
   * or stall. Now every oscillator tears itself down when it finishes.
   */
  const playAnthem = useCallback((): void => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      // Stop anything still ringing from a previous tap before starting over.
      for (const n of nodesRef.current) {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      }
      nodesRef.current = [];

      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      const notes = [
        523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0, 523.25, 659.25, 783.99, 880.0,
        783.99, 659.25, 523.25,
      ];
      const step = 0.32;
      let t = ctx.currentTime + 0.1;
      const created: OscillatorNode[] = [];

      for (const freq of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + step);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + step);
        // Release this note's chain when it finishes, otherwise the graph
        // grows by two nodes per note, forever.
        osc.onended = (): void => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            /* already torn down */
          }
        };
        created.push(osc);
        t += step;
      }
      nodesRef.current = created;

      // The master bus outlives every note by one; drop it once they are all
      // done so nothing is left resident in the graph.
      window.setTimeout(
        () => {
          try {
            master.disconnect();
          } catch {
            /* already torn down */
          }
        },
        notes.length * step * 1000 + 600,
      );

      setPlaying(true);
      window.setTimeout(
        () => setPlaying(false),
        notes.length * step * 1000 + 400,
      );
    } catch {
      /* Web Audio unavailable */
    }
  }, []);

  // Page teardown must not leave a live AudioContext running.
  useEffect(
    () => () => {
      for (const n of nodesRef.current) {
        try {
          n.stop();
          n.disconnect();
        } catch {
          /* ignore */
        }
      }
      nodesRef.current = [];
    },
    [],
  );
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => f + 1), 4200);
    return (): void => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setVerse((v) => v + 1), 5200);
    return (): void => window.clearInterval(id);
  }, []);
  const photo = VAULT_PHOTOS[frame % VAULT_PHOTOS.length]!;
  const lyric = ANTHEM_VERSES[verse % ANTHEM_VERSES.length]!;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
      <div className="relative aspect-video w-full bg-black">
        {VAULT_PHOTOS.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt={p.caption}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ${
              i === frame % VAULT_PHOTOS.length ? "bday-kenburns opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.15) 100%)",
          }}
        />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] tracking-[0.25em] text-[#f9edb0] uppercase backdrop-blur">
          <Music className="h-3 w-3" aria-hidden="true" />
          BUDI Anthem · AI Lyric Film
        </span>
        <button
          type="button"
          onClick={playAnthem}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[#d4af37]/90 px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-black uppercase transition-all hover:brightness-110"
          aria-label="Play AI anthem"
        >
          <Music className="h-3 w-3" aria-hidden="true" />
          {playing ? "♪ جاري التشغيل…" : "▶ شغّل الأغنية"}
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pt-10 pb-4">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-[#f9edb0] uppercase">
          <Clapperboard className="h-4 w-4" aria-hidden="true" />
          {photo.caption}
        </p>
        <p dir="rtl" lang="ar" className="mt-2 text-lg leading-relaxed font-bold text-white drop-shadow">
          {lyric.ar}
        </p>
        <p className="mt-1 text-xs text-white/70 italic">{lyric.en}</p>
        <p className="mt-2 font-mono text-[11px] text-white/60 tabular-nums">
          {(frame % VAULT_PHOTOS.length) + 1} / {VAULT_PHOTOS.length}
        </p>
      </div>
    </div>
  );
}

function FilmPanel({ preview }: { preview: boolean }): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [film, setFilm] = useState<"video" | "cinema">("cinema");
  const [filmError, setFilmError] = useState<string | null>(null);

  /**
   * Two-step probe. The manifest flag alone is not enough: it is easy to
   * flip `birthday: true` before the MP4 is actually uploaded, and a <video>
   * pointing at a 404 renders as a black box with a dead play button before
   * `onError` ever fires. So: read the flag, then confirm the bytes are really
   * there with a HEAD request. Only then do we commit to the video layout.
   */
  useEffect(() => {
    let alive = true;
    void (async (): Promise<void> => {
      try {
        const res = await fetch("/videos/manifest.json", { cache: "no-store" });
        const json: unknown = res.ok ? await res.json() : null;
        if (!alive) return;
        if (!json || typeof json !== "object" || (json as { birthday?: unknown }).birthday !== true) {
          return; // flag off → cinema, silently
        }
        // Flag is on — is the file actually deployed?
        const head = await fetch(VIDEO_SRC, { method: "HEAD", cache: "no-store" });
        if (!alive) return;
        if (head.ok) setFilm("video");
      } catch {
        /* offline or missing manifest — cinema stays */
      }
    })();
    return (): void => {
      alive = false;
    };
  }, []);

  /**
   * Unmute-then-play in one user gesture. Doing it in two steps (a separate
   * click on a mute toggle) trips the autoplay policy on iOS/Safari, which is
   * where this page is most likely to be opened.
   */
  const playFilm = (): void => {
    const v = videoRef.current;
    if (!v) return;
    setFilmError(null);
    v.muted = false;
    v.volume = 1;
    void v
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        setFilmError(
          "المتصفح رفض التشغيل التلقائي — اضغط زر ▶ نفسه اللي فوق، أو فعّل الصوت من إعدادات المتصفح.",
        );
      });
  };
  return (
    <div>
      {film === "video" ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster="/images/birthday/4.jpg"
            controls
            playsInline
            preload="metadata"
            onError={() => {
              // The file vanished between the HEAD probe and playback (a
              // redeploy mid-session). Fall back instead of showing a corpse.
              setFilm("cinema");
              setPlaying(false);
            }}
            onEnded={() => setPlaying(false)}
            className="aspect-video w-full bg-black"
          />
          {!playing && (
            <button
              type="button"
              onClick={playFilm}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity hover:bg-black/30"
              aria-label="Play film with sound"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37] text-black shadow-[0_0_40px_rgba(212,175,55,0.7)] transition-transform hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-current" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
          {filmError && (
            <p
              role="alert"
              className="absolute inset-x-4 bottom-4 rounded-lg border border-red-400/40 bg-black/85 px-3 py-2 text-center text-[11px] text-red-200"
            >
              {filmError}
            </p>
          )}
          <div className="bg-black/80 px-5 py-4">
            <p dir="rtl" lang="ar" className="text-center text-base font-bold text-[#f9edb0]">
              {ANTHEM_CHORUS_AR}
            </p>
            <p className="mt-1 text-center text-xs text-white/60 italic">{ANTHEM_CHORUS_EN}</p>
          </div>
        </div>
      ) : (
        <CinemaShow />
      )}
      <div className="mt-4 grid gap-3 rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/[0.04] p-5 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-[#d4af37] uppercase">
            <Music className="h-4 w-4" aria-hidden="true" />
            كلمات الأغنية — BUDI Anthem
          </p>
          <ul className="mt-3 space-y-2">
            {ANTHEM_VERSES.map((v, i) => (
              <li key={i} className="rounded-xl bg-black/40 px-3 py-2">
                <p dir="rtl" lang="ar" className="text-sm font-bold text-white">
                  {v.ar}
                </p>
                <p className="text-[11px] text-white/55 italic">{v.en}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-dashed border-[#d4af37]/40 bg-black/30 p-4 text-center">
          <p className="font-mono text-[11px] tracking-[0.25em] text-[#e9ce7a] uppercase">الكورس</p>
          <p dir="rtl" lang="ar" className="mt-2 text-xl font-black text-[#f9edb0]">
            {ANTHEM_CHORUS_AR}
          </p>
          <p className="mt-1 text-xs text-white/60 italic">{ANTHEM_CHORUS_EN}</p>
          <p className="mt-3 text-[11px] leading-relaxed text-white/50">
            عايز الفيديو الـ AI الكامل بصوت؟ حط ملف <span dir="ltr">birthday.mp4</span> في{" "}
            <span dir="ltr">public/videos/</span> وخلي <span dir="ltr">manifest.json → birthday: true</span> —
            الفيديو بيظهر لوحده أوتوماتيك أول ما الملف يكون موجود فعلاً.
          </p>
          {preview && (
            <p className="mt-2 rounded-lg bg-[#d4af37]/10 px-3 py-2 font-mono text-[10px] text-[#e9ce7a]">
              Preview tip — الفيلم الغنائي شغال، والفيديو هيشتغل تلقائي أول ما ترفعه.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Milliseconds left until the current day ENDS in Cairo.
 *
 * The countdown used to build the deadline with `end.setHours(23,59,59,999)`,
 * which is the VISITOR's local midnight — so a guest in Dubai, Berlin or
 * Cairo-on-a-laptop-with-a-wrong-clock saw a different "time left today" than
 * the vault actually closes at. The whole page is explicitly Cairo-timed
 * (BirthdayLocked already uses nextBirthdayStartMs), so the hero clock now
 * matches it.
 */
function msLeftInCairoDay(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((p) => p.type === type);
    const n = Number(found?.value ?? "0");
    return Number.isFinite(n) ? n : 0;
  };
  // Some ICU builds emit "24" for midnight under hour12:false.
  const h = read("hour") % 24;
  const m = read("minute");
  const s = read("second");
  const elapsed = h * 3600 + m * 60 + s;
  return Math.max(0, (86_400 - elapsed) * 1000 - 999);
}

/* ------------------------------------------------------------------ */
/* Gallery + lightbox                                                 */
/* ------------------------------------------------------------------ */

function GalleryWall({ onBurst }: { onBurst: () => void }): React.JSX.Element {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const count = VAULT_PHOTOS.length;

  // Scroll lock through the project's own counter, so stacking this lightbox
  // over any other modal can't leave the page permanently unscrollable.
  useBodyScrollLock(open !== null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((v) => (v === null ? v : (v + 1) % count));
      if (e.key === "ArrowLeft") setOpen((v) => (v === null ? v : (v - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    return (): void => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  // Move focus into the lightbox on open, and hand it back to the thumbnail
  // that opened it on close — without this, Tab walks behind the overlay and
  // a keyboard user is effectively stranded on the page underneath.
  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    return (): void => openerRef.current?.focus();
  }, [open]);

  const step = (delta: number): void =>
    setOpen((v) => (v === null ? v : (v + delta + count) % count));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {VAULT_PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              setOpen(i);
              onBurst();
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-[0_18px_50px_-16px_rgba(212,175,55,0.6)] ${
              i === 3 ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""
            }`}
          >
            <span className={`relative block w-full ${i === 3 ? "aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-72" : "aspect-square"}`}>
              <Image
                src={p.src}
                alt={p.caption}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
              <span className="inline-block rounded-full bg-[#d4af37]/90 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.2em] text-black uppercase">
                {p.tag}
              </span>
              <span className="mt-1 block text-xs leading-snug font-bold text-white">{p.caption}</span>
            </span>
          </button>
        ))}
      </div>
      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={VAULT_PHOTOS[open]!.caption}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-[#0c0c0e]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="relative block aspect-video w-full">
              <Image
                src={VAULT_PHOTOS[open]!.src}
                alt={VAULT_PHOTOS[open]!.caption}
                fill
                sizes="100vw"
                className="object-contain bg-black"
              />
            </span>
            <div className="p-5">
              <p className="font-bold text-[#f9edb0]">{VAULT_PHOTOS[open]!.caption}</p>
              <p dir="rtl" lang="ar" className="mt-2 text-sm leading-relaxed text-white/75">
                {VAULT_PHOTOS[open]!.story}
              </p>
              <p className="mt-2 font-mono text-[11px] text-white/40 tabular-nums">
                {open + 1} / {count}
              </p>
            </div>
            {/* Icons were swapped relative to their labels: "Previous" drew a
                right-pointing chevron while stepping backwards. Arrow keys
                keep their existing mapping (Right = next). */}
            <span className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                ref={closeRef}
                aria-label="Close"
                onClick={() => setOpen(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#d4af37] hover:text-black"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => step(1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#d4af37] hover:text-black"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => step(-1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#d4af37] hover:text-black"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wishes — validated, persisted locally                              */
/* ------------------------------------------------------------------ */

const WISH_KEY = "budi-vault-wishes";

function sanitizeWish(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 140) return null;
  return t;
}

function WishesSection({ onBurst }: { onBurst: () => void }): React.JSX.Element {
  const [custom, setCustom] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISH_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, 140)).slice(0, 30);
        setCustom(clean);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = (next: string[]): void => {
    setCustom(next);
    try {
      window.localStorage.setItem(WISH_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  };

  /**
   * Remove one of YOUR wishes. Only the local ones are removable — the
   * built-in DEFAULT_WISHES ship with the page. Previously a visitor could
   * add up to 30 wishes and then had no way to take a single one back; a
   * typo or a joke they regretted was permanent for that browser.
   */
  const removeWish = (index: number): void => {
    if (index < 0 || index >= custom.length) return;
    const next = custom.filter((_, i) => i !== index);
    persist(next);
    onBurst();
  };

  const addWish = (): void => {
    const clean = sanitizeWish(input);
    if (!clean) {
      setError("اكتب أمنية من 2 لـ 140 حرف — كلمة حلوة تكفي.");
      return;
    }
    const next = [...custom, clean].slice(-30);
    persist(next);
    setInput("");
    setError(null);
    setFlash(clean);
    onBurst();
    window.setTimeout(() => setFlash(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="vault-wish" className="sr-only">
          اكتب أمنية لبوبدي
        </label>
        <input
          id="vault-wish"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 140))}
          onKeyDown={(e) => {
            if (e.key === "Enter") addWish();
          }}
          placeholder="اكتب أمنيتك لبوبدي هنا…"
          dir="auto"
          maxLength={140}
          className="h-12 flex-1 rounded-xl border border-white/10 bg-black/50 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#d4af37]/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={addWish}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 text-sm font-black text-[#2b2305] transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          <Gift className="h-4 w-4" aria-hidden="true" />
          علّق أمنية
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
      <div aria-live="polite" className="mt-3 min-h-6">
        {flash && (
          <p className="mx-auto w-fit rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5 text-xs text-[#f9edb0]">
            ✨ اتعلقت: {flash}
          </p>
        )}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {DEFAULT_WISHES.map((w) => (
          <li
            key={w}
            className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-relaxed text-white/85"
          >
            <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-[#e9ce7a]" aria-hidden="true" />
            <span dir="auto">{w}</span>
          </li>
        ))}
        {custom.map((w, i) => (
          <li
            key={`own-${i}-${w}`}
            className="group flex items-start gap-2 rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/[0.05] px-3 py-2.5 text-sm leading-relaxed text-white/90"
          >
            <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />
            <span dir="auto" className="min-w-0 flex-1 break-words">
              {w}
            </span>
            <button
              type="button"
              onClick={() => removeWish(i)}
              aria-label={`امسح الأمنية: ${w}`}
              className="shrink-0 cursor-pointer rounded-md p-1 text-white/25 transition-colors hover:bg-red-500/20 hover:text-red-300 focus-visible:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {custom.length > 0 && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
          {custom.length} / 30 من أمنياتك · محفوظة على جهازك بس
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cake game — blow the candles                                       */
/* ------------------------------------------------------------------ */

function CakeGame({ onBurst }: { onBurst: () => void }): React.JSX.Element {
  const [out, setOut] = useState<boolean[]>([false, false, false, false, false]);
  const allOut = out.every(Boolean);
  useEffect(() => {
    if (allOut) onBurst();
  }, [allOut, onBurst]);
  return (
    <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/10 to-transparent p-6 text-center">
      <p className="font-mono text-[11px] tracking-[0.3em] text-[#d4af37] uppercase">اضغط على الشمعة عشان تطفيها</p>
      <div className="mt-4 flex items-end justify-center gap-3" role="group" aria-label="Birthday candles">
        {out.map((isOut, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              setOut((prev) => {
                const next = [...prev];
                next[i] = !next[i];
                return next;
              })
            }
            aria-pressed={isOut}
            aria-label={isOut ? `شمعة ${i + 1} مطفية — ولعها` : `شمعة ${i + 1} والعة — اطفيها`}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <span className="mx-auto block h-10 w-2.5 rounded-full bg-gradient-to-b from-[#f9edb0] to-[#d4af37]" />
            <span className="mx-auto mt-1 block h-8 w-8">
              {isOut ? (
                <span className="block h-full w-full rounded-full bg-white/10 text-center text-white/30">💨</span>
              ) : (
                <Flame className="h-8 w-8 fill-orange-500 text-yellow-300 drop-shadow-[0_0_12px_rgba(255,150,0,0.9)]" aria-hidden="true" />
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-6xl" aria-hidden="true">
        🎂
      </p>
      {allOut ? (
        <p className="mx-auto mt-3 w-fit rounded-full bg-[#d4af37] px-5 py-2 text-sm font-black text-black">
          برافو! أمنيتك اتسجلت في النجوم ✨
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOut([false, false, false, false, false])}
          className="mt-3 cursor-pointer font-mono text-[11px] tracking-[0.25em] text-faint uppercase hover:text-accent"
        >
          ولّع الكل من جديد
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* OPEN — the Level-10 celebration                                    */
/* ------------------------------------------------------------------ */

export function BirthdayOpen({ preview }: { preview: boolean }): React.JSX.Element {
  const { ref, burst } = useConfetti(true);
  const age = useAgeOnBirthday();
  const [party, setParty] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailId = useRef(0);
  // Mouse trail of stars
  const trailReduced = useReducedMotion();
  useEffect(() => {
    if (typeof window === "undefined" || trailReduced) return;
    // FIX: this used to call setState on EVERY mousemove — a 144Hz mouse
    // meant 144 React renders/sec, each allocating a fresh 19-element array,
    // and it ignored prefers-reduced-motion entirely while the confetti
    // canvas right above it honoured it. Now coalesced to one update per
    // animation frame (the most a 60Hz display can even show) and skipped
    // entirely when the visitor asked for less motion.
    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const flush = (): void => {
      raf = 0;
      if (!pending) return;
      trailId.current += 1;
      const point = { x: pending.x, y: pending.y, id: trailId.current };
      pending = null;
      setTrail((prev) => [...prev.slice(-18), point]);
    };
    const onMove = (e: MouseEvent): void => {
      pending = { x: e.clientX, y: e.clientY };
      if (raf === 0) raf = window.requestAnimationFrame(flush);
    };
    window.addEventListener("mousemove", onMove);
    return (): void => {
      if (raf !== 0) window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [trailReduced]);
  // Auto-clear trail
  useEffect(() => {
    const id = window.setInterval(() => setTrail((p) => p.slice(1)), 80);
    return (): void => window.clearInterval(id);
  }, []);
  // Countdown to end of birthday day (Cairo)
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = (): void => {
      const diff = msLeftInCairoDay(new Date());
      setLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1000),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return (): void => window.clearInterval(id);
  }, []);
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#0a0a0b]">
      <style>{`
        .bday-caret { animation: bday-blink 1s steps(2) infinite; }
        @keyframes bday-blink { 50% { opacity: 0; } }
        .bday-kenburns { animation: bday-kb 5s ease-out forwards; }
        @keyframes bday-kb { from { transform: scale(1.12); } to { transform: scale(1); } }
        .bday-float { animation: bday-float 5s ease-in-out infinite; }
        @keyframes bday-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .bday-disco { position: absolute; width: 60vmax; height: 60vmax; border-radius: 50%; filter: blur(60px); opacity: 0.35; mix-blend-mode: screen; animation: bday-disco 4s linear infinite; }
        .bday-disco-a { background: radial-gradient(circle, #ff3d00, transparent 60%); top: -20%; left: -10%; }
        .bday-disco-b { background: radial-gradient(circle, #d7fd44, transparent 60%); bottom: -20%; right: -10%; animation-delay: -1.3s; }
        .bday-disco-c { background: radial-gradient(circle, #a78bfa, transparent 60%); top: 30%; left: 40%; animation-delay: -2.6s; }
        @keyframes bday-disco { 0% { transform: translate(0,0) scale(1); } 33% { transform: translate(10vw, -5vh) scale(1.2); } 66% { transform: translate(-8vw, 8vh) scale(0.9); } 100% { transform: translate(0,0) scale(1); } }
      `}</style>
      <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" />
      {/* Mouse trail stars */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55]">
        {trail.map((t) => (
          <span
            key={t.id}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f9edb0] opacity-80"
            style={{ left: t.x, top: t.y, boxShadow: "0 0 8px #d4af37", transition: "opacity 0.6s" }}
          />
        ))}
      </div>
      {/* Disco lights overlay (party mode) */}
      {party && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
          <span className="bday-disco bday-disco-a" />
          <span className="bday-disco bday-disco-b" />
          <span className="bday-disco bday-disco-c" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,175,55,0.14), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 90%, rgba(255,61,0,0.10), transparent 65%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-4xl px-5 pt-14 pb-16 sm:px-8">
        {preview && (
          <p className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-dashed border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.25em] text-[#e9ce7a] uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Preview mode — locked for visitors until Oct 24
          </p>
        )}

        {/* Party mode + countdown */}
        <div className="mx-auto mb-6 flex w-fit flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setParty((p) => !p);
              if (!party) burst();
            }}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition-all hover:-translate-y-0.5 ${
              party
                ? "bg-gradient-to-r from-[#ff3d00] via-[#d7fd44] to-[#a78bfa] text-black shadow-[0_0_30px_rgba(255,61,0,0.6)]"
                : "border border-[#d4af37]/50 bg-[#d4af37]/10 text-[#e9ce7a]"
            }`}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {party ? "🎉 Party Mode ON" : "🎉 Party Mode"}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-4 py-2 font-mono text-[11px] text-white/70 tabular-nums">
            <Clock className="h-3.5 w-3.5 text-[#d4af37]" aria-hidden="true" />
            {left.h}h {String(left.m).padStart(2, "0")}m {String(left.s).padStart(2, "0")}s left today
            <span className="text-white/35">· Cairo</span>
          </span>
        </div>

        {/* HERO */}
        <div className="flex justify-center">
          <span className="bday-float relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[#d4af37]/50 bg-[#d4af37]/10 shadow-[0_0_50px_rgba(212,175,55,0.45)]">
            <Crown className="h-9 w-9 text-[#e9ce7a]" aria-hidden="true" />
          </span>
        </div>
          <p className="mt-6 text-center font-mono text-xs tracking-[0.5em] text-[#d4af37] uppercase">
            24 أكتوبر · خزنة بودي · مفتوحة
          </p>
          <h1 className="display mt-3 text-center text-[clamp(2.6rem,9vw,5.5rem)] leading-none font-black tracking-tight">
            <span
              className="block"
              style={{
                background: "linear-gradient(100deg, #f9edb0 10%, #d4af37 45%, #ff3d00 90%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 0 26px rgba(212,175,55,0.35))",
              }}
            >
              عيد ميلاد سعيد
            </span>
            <span className="mt-2 block text-foreground">بودي · {age.years}</span>
          </h1>
          <p className="mt-3 text-center text-sm text-muted">
            {profile.name} · مطور Full-Stack · السويس، العراق · {age.daysLived.toLocaleString("en-US")} يوم من العظمة
          </p>

        <div className="mt-6 flex justify-center">
          <Logo />
        </div>

        <div className="mt-6">
          <Typewriter />
        </div>

        {/* NUMBERS */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Cake, v: String(age.years), l: "سنة عظمة" },
            { icon: Clock, v: age.daysLived.toLocaleString("en-US"), l: "يوم صمود" },
            { icon: Zap, v: age.hoursLived.toLocaleString("en-US"), l: "ساعة سعي" },
            { icon: Trophy, v: `${VAULT_PHOTOS.length}`, l: "صور في الخزنة" },
          ].map(({ icon: Icon, v, l }) => (
            <div
              key={l}
              className="rounded-2xl border border-[#d4af37]/25 bg-black/40 p-4 text-center transition-all hover:-translate-y-1 hover:border-[#d4af37]/60"
            >
              <Icon className="mx-auto h-5 w-5 text-[#e9ce7a]" aria-hidden="true" />
              <p className="mt-2 font-mono text-xl font-black text-[#f9edb0] tabular-nums">{v}</p>
              <p className="mt-1 text-xs text-white/60">{l}</p>
            </div>
          ))}
        </div>

        {/* AI FILM */}
        <div className="mt-14">
          <Eyebrow icon={<Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 01 · AI Anthem Film" />
          <div className="mt-4">
            <SectionTitle ar="أغنية بودي — الفيلم الغنائي" en="BUDI Anthem — made with love + AI" />
          </div>
          <div className="mt-6">
            <FilmPanel preview={preview} />
          </div>
        </div>

        {/* GALLERY */}
        <div className="mt-14">
          <Eyebrow icon={<Camera className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 02 · The Vault Gallery" />
          <div className="mt-4">
            <SectionTitle ar="الخزنة اتفتحت — 10 صور بيحكوا حكايتك" en="10 frames of you" />
          </div>
          <p dir="rtl" lang="ar" className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/60">
            دوس على أي صورة عشان تكبرها وتقرا الحكاية اللي وراها. الصور دي من مشروع Massar بتاعك — من 1 لـ 7 — plus
            صور البورتفوليو الأصلية.
          </p>
          <div className="mt-6">
            <GalleryWall onBurst={burst} />
          </div>
        </div>

        {/* TIMELINE */}
        <div className="mt-14">
          <Eyebrow icon={<Calendar className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 03 · Memories Road" />
          <div className="mt-4">
            <SectionTitle ar="طريق الذكريات — من 2006 لحد 2030" en="The road so far" />
          </div>
          <ol className="relative mt-8 space-y-4 border-r-2 border-[#d4af37]/25 pr-5">
            {TIMELINE.map((s) => (
              <li key={s.year} className="relative rounded-2xl border border-white/10 bg-black/40 p-4">
                <span
                  aria-hidden="true"
                  className="absolute top-4 -right-[27px] h-3 w-3 rounded-full bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.9)]"
                />
                <p className="font-mono text-xs tracking-[0.3em] text-[#d4af37]">{s.year}</p>
                <p className="mt-1 font-bold text-white">{s.title}</p>
                <p dir="rtl" lang="ar" className="text-sm font-bold text-[#f9edb0]">
                  {s.titleAr}
                </p>
                <p dir="rtl" lang="ar" className="mt-2 text-sm leading-relaxed text-white/70">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* QUOTES */}
        <div className="mt-14">
          <Eyebrow icon={<Quote className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 04 · Fuel Wall" />
          <div className="mt-4">
            <SectionTitle ar="كلام يشحنك — علّقه في أوضتك" en="Words to run on" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {FUEL_QUOTES.map((q, i) => (
              <figure
                key={i}
                className="rounded-2xl border border-white/10 bg-surface/50 p-4 transition-all hover:-translate-y-1 hover:border-[#d4af37]/50"
              >
                <Quote className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
                <blockquote dir={q.dir} lang={q.lang} className="mt-2 text-sm leading-relaxed font-bold text-white">
                  {q.text}
                </blockquote>
                <figcaption className="mt-2 font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  — {q.by}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* LETTER */}
        <div className="mt-14 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/10 to-transparent p-6 sm:p-8">
          <Eyebrow icon={<Heart className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 05 · Letter to the future" />
          <div className="mt-4 text-center">
            <p dir="rtl" lang="ar" className="font-display text-xl font-black text-foreground sm:text-2xl">
              رسالة من بودي… إلى بودي بتاع 2030
            </p>
          </div>
          <div dir="rtl" lang="ar" className="mx-auto mt-4 max-w-2xl space-y-3 text-sm leading-loose text-white/75">
            <p>
              يا بودي… لو بتقرا الكلام ده وانت 24 سنة، فاعرف إن الراجل اللي عنده 20 سنة ده كان بيحلم بيك كل يوم. كان
              بيسهر عشان انت ترتاح، وبيتعلم عشان انت تُعلّم، وبيقع ويقوم عشان انت تقف ثابت.
            </p>
            <p>
              متنساش السويس، ومتنساش أمك وأبوك اللي شافوا فيك اللي انت لسه مش شايفه. ومتنساش إن الفلوس وسيلة مش غاية —
              الغاية إنك تبني حاجة تنفع الناس وتفضل بعدك.
            </p>
            <p className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-4 text-center font-bold text-[#f9edb0]">
              الوعد: كل سنة هتفتح الخزنة دي، هتلاقي نفسك أكبر… بس قلبك لسه نفس القلب النضيف. وعد؟
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {stackChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-bold text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            From Suez to the world
          </p>
        </div>

        {/* WISHES + CAKE */}
        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <div>
            <Eyebrow icon={<Star className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 06 · Wishes Wall" />
            <div className="mt-4">
              <WishesSection onBurst={burst} />
            </div>
          </div>
          <div>
            <Eyebrow icon={<Cake className="h-3.5 w-3.5" aria-hidden="true" />} text="Level 07 · Make a wish" />
            <div className="mt-4">
              <CakeGame onBurst={burst} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: HeartHandshake, title: "Stay human", text: "Family first, code second." },
                { icon: Star, title: "Keep the bar high", text: "Sign only great work." },
                { icon: Zap, title: "Ship fast", text: "Done, then polish." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border bg-surface/60 p-3 text-center">
                  <Icon className="mx-auto h-5 w-5 text-[#e9ce7a]" aria-hidden="true" />
                  <p className="mt-1 text-xs font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={burst}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#d4af37] px-8 py-4 text-sm font-black text-[#2b2305] shadow-[0_16px_50px_-12px_rgba(212,175,55,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            <PartyPopper className="h-4 w-4" aria-hidden="true" />
            انفجر فرحة 🎉
          </button>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/"
            className="font-mono text-[11px] tracking-[0.3em] text-faint uppercase transition-colors hover:text-accent"
          >
            ← Back to the portfolio
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LOCKED — the golden vault with live Cairo countdown                */
/* ------------------------------------------------------------------ */

export function BirthdayLocked({ preview }: { preview: boolean }): React.JSX.Element {
  const now = useNow(1000);
  const target = nextBirthdayStartMs(now ? now.getTime() : Date.now());
  const left = splitCountdown(target - (now ? now.getTime() : Date.now()));
  const days = daysUntilBirthday(now ?? new Date());
  const progress = Math.min(100, Math.max(0, ((365 - days) / 365) * 100));
  const [notified, setNotified] = useState(false);
  const cells = [
    { v: left.d, l: "Days" },
    { v: left.h, l: "Hrs" },
    { v: left.m, l: "Min" },
    { v: left.s, l: "Sec" },
  ];

  useEffect(() => {
    try {
      if (window.localStorage.getItem("budi-vault-notify") === "1") setNotified(true);
    } catch {
      /* ignore */
    }
  }, []);

  const askNotify = (): void => {
    try {
      window.localStorage.setItem("budi-vault-notify", "1");
    } catch {
      /* ignore */
    }
    setNotified(true);
    try {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission().catch(() => undefined);
      }
    } catch {
      /* unsupported */
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0b] px-5 py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(212,175,55,0.12), transparent 65%), radial-gradient(ellipse 40% 30% at 80% 90%, rgba(255,61,0,0.08), transparent 65%)",
        }}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-[#d4af37]/30 bg-[#0c0c0e]/95 p-6 text-center shadow-[0_0_80px_rgba(212,175,55,0.18)] sm:p-8">
        {preview && (
          <p className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-dashed border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-1.5 font-mono text-[10px] tracking-[0.25em] text-[#e9ce7a] uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Preview — visitors see this lock
          </p>
        )}
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 shadow-[0_0_30px_rgba(212,175,55,0.35)]">
          <Lock className="h-7 w-7 text-[#e9ce7a]" aria-hidden="true" />
        </span>
        <p className="mt-4 font-mono text-[11px] tracking-[0.4em] text-[#d4af37] uppercase">BUDI Vault · خزنة بودي</p>
        <h1 className="font-display mt-2 text-2xl font-black text-foreground sm:text-3xl">
          الكنز مقفول… وهيفتح 24 أكتوبر
        </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            تفتح هذه الصفحة كل عام في <span className="font-bold text-[#e9ce7a]">24 أكتوبر</span> — بتوقيت القاهرة.
            داخلها: 10 صور، فيلم الأغنية، رسالة للمستقبل، وحائط أمنيات.
          </p>

        <div className="mt-6 grid grid-cols-4 gap-2" role="timer" aria-label="Countdown to October 24">
          {cells.map(({ v, l }) => (
            <div key={l} className="rounded-xl border border-[#d4af37]/25 bg-black/50 px-2 py-3">
              <p className="font-mono text-2xl font-black text-[#f9edb0] tabular-nums" suppressHydrationWarning>
                {String(v).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-[9px] tracking-[0.25em] text-faint uppercase">{l}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-faint uppercase" suppressHydrationWarning>
          Cairo time · {days} {days === 1 ? "day" : "days"} left
        </p>
        <p dir="rtl" lang="ar" className="mt-1 text-sm font-bold text-[#e9ce7a]">
          فاضل {days} {days === 1 ? "يوم" : "يوم"} ويفتح — استناني يا بطل ⏳
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-faint uppercase">
            <span>Year progress</span>
            <span suppressHydrationWarning>{progress.toFixed(1)}%</span>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#f9edb0] to-[#ff3d00]"
              style={{ width: `${progress.toFixed(1)}%` }}
            />
          </div>
        </div>

        {/* Teaser */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-5 gap-1 p-1">
            {VAULT_PHOTOS.slice(0, 5).map((p) => (
              <span key={p.src} className="relative block aspect-square overflow-hidden rounded-lg">
                <Image src={p.src} alt="" fill sizes="20vw" loading="lazy" className="object-cover blur-[6px] brightness-75" />
              </span>
            ))}
          </div>
          <p className="bg-black/60 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-white/60 uppercase">
            10 photos · Anthem film · Letter 2030 · Locked
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={askNotify}
            disabled={notified}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-[#e9ce7a] uppercase transition-all hover:-translate-y-0.5 hover:bg-[#d4af37]/20 disabled:cursor-default disabled:opacity-70"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            {notified ? "متنساش — هفكرك 😉" : "فكرني يوم 24"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-faint uppercase transition-colors hover:text-accent"
          >
            ← Back to the portfolio
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gate — resolves AFTER mount (SSR/first paint stay identical)        */
/* ------------------------------------------------------------------ */

export default function BirthdayExperience(): React.JSX.Element {
  const [gate, setGate] = useState<{ open: boolean; preview: boolean } | null>(null);
  useEffect(() => {
    try {
      // Locked with a deadline: opens every Oct 24 (Cairo) — or with a
      // dashboard preview pass (stamped by the console only, 15 min).
      const now = new Date();
      const bday = isBirthday(now);
      const pass = !bday && hasBirthdayPreview();
      setGate({ open: bday || pass, preview: pass });
    } catch {
      setGate({ open: false, preview: false });
    }
  }, []);
  if (!gate) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0a0a0b]">
        <p className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">Opening the vault…</p>
      </div>
    );
  }
  return gate.open ? <BirthdayOpen preview={gate.preview} /> : <BirthdayLocked preview={false} />;
}
