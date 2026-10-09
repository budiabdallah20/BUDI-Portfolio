"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import { storeSecret } from "./remote";
import { isWorkspaceAuthed, markWorkspaceAuthed } from "./workspaces";

export interface LoginWorkspace {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  theme: string;
  pin: string;
  kind: "builtin" | "external";
}

export const SECRET_CODE = "2909";
const AUTH_KEY = "budi-admin";

/** Boot status lines — cinematic, same spirit as the main-site loader. */
const BOOT_LINES = [
  "Waking secure shell…",
  "Verifying private area…",
  "Decrypting dashboard…",
  "Access gate ready",
] as const;

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

/** Colorful admin backdrop — aurora orbs + grid + vignette + floating dust. */
function AdminBackdrop(): React.JSX.Element {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(130deg, #0a0a0b 0%, #160c04 35%, #0d1407 62%, #0a0a0b 100%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="animate-aurora-a absolute -top-[12%] -left-[8%] h-[55vmax] w-[55vmax] rounded-full bg-[#ff3d00]/20 blur-[110px]" />
        <div className="animate-aurora-b absolute -right-[10%] -bottom-[15%] h-[52vmax] w-[52vmax] rounded-full bg-[#bef264]/10 blur-[110px]" />
        <div className="animate-aurora-c absolute top-[25%] left-[55%] h-[30vmax] w-[30vmax] rounded-full bg-violet-600/25 blur-[100px]" />
        <div
          className="animate-aurora-a absolute top-[60%] left-[8%] h-[24vmax] w-[24vmax] rounded-full bg-cyan-400/10 blur-[90px]"
          style={{ animationDelay: "2s" }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(244,244,239,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,244,239,0.045) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 85% 70% at 50% 40%, black 30%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 70% at 50% 40%, black 30%, transparent 78%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 30%, rgba(255,61,0,0.12), transparent 65%)",
        }}
      />
      {/* Floating dust */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {[
          { l: "12%", t: "22%", d: "0s", s: "6px" },
          { l: "82%", t: "18%", d: "1.2s", s: "5px" },
          { l: "68%", t: "72%", d: "0.6s", s: "7px" },
          { l: "28%", t: "78%", d: "2s", s: "4px" },
          { l: "48%", t: "12%", d: "1.7s", s: "5px" },
          { l: "90%", t: "55%", d: "2.6s", s: "4px" },
        ].map((p, i) => (
          <span
            key={i}
            className="animate-float-slow absolute rounded-full bg-[#bef264]/60"
            style={{
              left: p.l,
              top: p.t,
              width: p.s,
              height: p.s,
              animationDelay: p.d,
              boxShadow: "0 0 12px rgba(190,242,100,0.8)",
            }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 95% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </>
  );
}

/** Mini boot → PIN gate. Colorful loader with 0→100, then a glowing PIN gate. */
export default function Login({
  onAuthed,
  workspace,
  onSwitchAccount,
}: {
  onAuthed: () => void;
  /** BUDI OS account — per-workspace PIN, logo, theme. Omitted = legacy gate. */
  workspace?: LoginWorkspace;
  /** Back to the BUDI OS hub (account switcher). */
  onSwitchAccount?: () => void;
}): React.JSX.Element {
  /** Only the main BUDI Portfolio console verifies server-side (it owns
   *  the cloud secret). Every other account is a local gate: its own
   *  4-digit PIN, its own isolated storage, zero cloud calls. */
  const isMain = !workspace || workspace.id === "budi-portfolio";
  const accent = workspace?.theme ?? "#ff3d00";
  const [booted, setBooted] = useState(false);
  const [bootPct, setBootPct] = useState(0);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const doneRef = useRef(onAuthed);
  doneRef.current = onAuthed;

  /* Boot progress 0 → 100 — mirrors the main-site loader counter.
     rAF drives the animation; an independent timeout guarantees the gate
     opens even if rAF stalls (background tab, throttled device). */
  useEffect(() => {
    if (workspace && isWorkspaceAuthed(workspace.id)) {
      onAuthed();
      return;
    }
    if (isAuthed()) {
      onAuthed();
      return;
    }
    let done = false;
    const open = (): void => {
      if (done) return;
      done = true;
      setBootPct(100);
      window.setTimeout(() => {
        setBooted(true);
        window.setTimeout(() => boxes.current[0]?.focus(), 120);
      }, 220);
    };
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number): void => {
      if (done) return;
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setBootPct(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        open();
      }
    };
    raf = requestAnimationFrame(tick);
    const fallback = window.setTimeout(open, 3000);
    return (): void => {
      done = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (): void => {
    setError(true);
    setShake((s) => s + 1);
    setAttempts((a) => a + 1);
    setDigits(["", "", "", ""]);
    window.setTimeout(() => boxes.current[0]?.focus(), 80);
    window.setTimeout(() => setError(false), 1700);
  };

  const win = (secret: string, persistSecret = true): void => {
    setSuccess(true);
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(AUTH_KEY, "1");
        if (persistSecret) storeSecret(secret);
        if (workspace) markWorkspaceAuthed(workspace.id);
      } catch {
        /* session-only fallback */
      }
      doneRef.current();
    }, 550);
  };

  /**
   * PIN verification — the secret is checked SERVER-side (/api/admin/verify,
   * brute-force shielded). Local 2909 fallback applies ONLY when the API is
   * unreachable or unconfigured, so the gate never locks you out locally —
   * real protection always lives on the server around every write.
   */
  const submit = (values: string[]): void => {
    if (success || checking) return;
    if (values.some((d) => d === "")) return;
    const pin = values.join("");
    // Local accounts: instant 4-digit gate, no server round-trip, no
    // cloud secret — the console runs fully local for this workspace.
    if (!isMain && workspace) {
      setChecking(true);
      window.setTimeout(() => {
        setChecking(false);
        if (pin === workspace.pin) win(pin, false);
        else fail();
      }, 350);
      return;
    }
    setChecking(true);
    setLockMsg(null);
    void (async (): Promise<void> => {
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: pin }),
        });
        setChecking(false);
        if (res.ok) {
          // 200 carries { ok } — a wrong PIN answers { ok: false } with a 200
          // on purpose, so typos never log a red 4xx in the console.
          let ok = false;
          try {
            ok = ((await res.json()) as { ok?: unknown }).ok === true;
          } catch {
            /* non-JSON — treat as failure */
          }
          if (ok) {
            win(pin);
            return;
          }
          fail();
          return;
        }
        if (res.status === 429) {
          let msg = "Too many tries — locked, retry later";
          try {
            const j = (await res.json()) as { error?: string };
            if (j.error) msg = j.error;
          } catch {
            /* keep default */
          }
          setLockMsg(msg);
          fail();
          return;
        }
        if (res.status === 500) {
          // Server misconfigured — local fallback gate (dev resilience).
          if (pin === SECRET_CODE) win(pin);
          else fail();
          return;
        }
        fail();
      } catch {
        // Offline — local fallback gate so the dashboard stays usable.
        setChecking(false);
        if (pin === SECRET_CODE) win(pin);
        else fail();
      }
    })();
  };

  const onDigit = (index: number, value: string): void => {
    if (success || checking) return;
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError(false);
    if (clean && index < 3) {
      boxes.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      window.setTimeout(() => submit(next), 140);
    }
  };

  const onKey = (index: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      boxes.current[index - 1]?.focus();
    }
    if (event.key === "Enter") {
      submit(digits);
    }
    if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
      /* allow paste flow — handled by onPaste */
    }
  };

  const onPaste = (event: React.ClipboardEvent): void => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 0) return;
    event.preventDefault();
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i += 1) next[i] = text[i] ?? "";
    setDigits(next);
    const firstEmpty = next.findIndex((d) => d === "");
    if (firstEmpty === -1) window.setTimeout(() => submit(next), 140);
    else boxes.current[firstEmpty]?.focus();
  };

  const filled = digits.filter((d) => d !== "").length;
  const pinPct = Math.round((filled / 4) * 100);
  const bootLine =
    BOOT_LINES[Math.min(BOOT_LINES.length - 1, Math.floor((bootPct / 100) * BOOT_LINES.length))];

  /* ————— BOOT / LOADING SCREEN ————— */
  if (!booted) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Loading admin — ${bootPct} percent`}
        className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0b] px-5"
      >
        <AdminBackdrop />
        <p className="absolute top-0 flex w-full items-center justify-between px-6 pt-6 font-mono text-[11px] tracking-[0.25em] text-white/50 uppercase sm:px-10">
          <span>BUDI&reg; Admin</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#bef264]" aria-hidden="true" />
            Secure shell
          </span>
        </p>
        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
          <span className="relative flex h-28 w-28 items-center justify-center">
            <span
              aria-hidden="true"
              className="animate-spin-conic absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #ff3d00, #bef264, #22d3ee, #8b5cf6, #ff3d00)",
                mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                maskComposite: "exclude",
                WebkitMaskComposite: "xor",
                padding: "3px",
                filter: "drop-shadow(0 0 14px rgba(255,61,0,0.55))",
              }}
            />
            <span className="scale-125">
              <Logo />
            </span>
          </span>
          <p className="mt-6 font-mono text-[11px] tracking-[0.45em] text-white/60 uppercase">
            Admin
          </p>
          <p className="font-display mt-2 text-7xl font-bold text-white tabular-nums sm:text-8xl">
            {bootPct}
            <span className="text-2xl text-[#ff3d00]">%</span>
          </p>
          <p className="mt-2 h-4 font-mono text-[11px] tracking-[0.25em] text-[#bef264]/80 uppercase">
            {bootLine}
          </p>
          <div className="mt-5 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full w-full origin-left rounded-full"
              style={{
                transform: `scaleX(${bootPct / 100})`,
                background:
                  "linear-gradient(to right, #ff3d00, #bef264 55%, #22d3ee)",
                boxShadow: "0 0 16px rgba(255,61,0,0.8)",
              }}
            />
          </div>
          <div className="mt-3 flex w-full items-center justify-between font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase tabular-nums">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
        <p className="absolute bottom-0 w-full px-6 pb-6 text-center font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase sm:px-10">
          Encrypted gate · BUDI private area
        </p>
      </div>
    );
  }

  /* ————— LOGIN / PIN GATE ————— */
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0b] px-5 py-10">
      <AdminBackdrop />
      <a
        href="/"
        className="absolute top-5 left-5 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-white/70 uppercase backdrop-blur-md transition-colors hover:border-[#ff3d00]/60 hover:text-[#ff3d00] sm:top-7 sm:left-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Site
      </a>
      <p className="absolute top-5 right-5 z-10 hidden items-center gap-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-[#bef264] uppercase sm:top-7 sm:right-8 md:flex">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-[#bef264]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#bef264]" />
        </span>
        Encrypted
      </p>

      <div key={shake} className={cn("relative z-10 w-full max-w-sm", shake > 0 && "animate-shake")}>
        {/* Gradient-border shell */}
        <div className="relative rounded-2xl p-[1.5px]">
          <span
            aria-hidden="true"
            className="animate-spin-conic absolute inset-[-60%] m-auto h-[220%] w-[60%]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, #ff3d00 12%, #bef264 25%, transparent 38%, transparent 55%, #22d3ee 68%, #8b5cf6 80%, transparent 92%)",
              filter: "blur(6px)",
              opacity: 0.85,
            }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-8 text-center backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24"
              style={{
                background:
                  "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,61,0,0.16), transparent 70%)",
              }}
            />
            <div className="relative flex justify-center">
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${accent}66`,
                  backgroundColor: `${accent}1a`,
                  boxShadow: `0 0 28px ${accent}66`,
                }}
              >
                {success ? (
                  <Check className="animate-success-ring h-7 w-7 text-[#bef264]" aria-hidden="true" />
                ) : (
                  <Lock className="h-7 w-7" style={{ color: accent }} aria-hidden="true" />
                )}
              </span>
            </div>
            <div className="relative mt-4 flex justify-center">
              {workspace && workspace.logo !== "" ? (
                <span className="relative block h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white">
                  <SmartImage src={workspace.logo} alt="" fill fit="contain" sizes="40px" />
                </span>
              ) : (
                <Logo />
              )}
            </div>
            <h1 className="font-display relative mt-3 text-2xl font-bold text-[#f4f4ef]">
              {workspace ? workspace.name : "Admin Access"}
            </h1>
            <p className="relative mt-1.5 flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.3em] text-[#8a8a82] uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-[#bef264]" aria-hidden="true" />
              Enter the secret code
            </p>

            {/* PIN progress — the 1→100 thread, tied to typed digits */}
            <div className="relative mt-6">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase tabular-nums">
                <span>Unlock</span>
                <span className={cn(filled === 4 ? "text-[#bef264]" : "text-white/50")}>
                  {pinPct}%
                </span>
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${pinPct}%`,
                    background:
                      filled === 4
                        ? "linear-gradient(to right, #bef264, #22d3ee)"
                        : "linear-gradient(to right, #ff3d00, #bef264)",
                    boxShadow:
                      filled === 4
                        ? "0 0 12px rgba(190,242,100,0.8)"
                        : "0 0 12px rgba(255,61,0,0.7)",
                  }}
                />
              </div>
            </div>

            <form
              className="relative mt-5 flex justify-center gap-3"
              dir="ltr"
              onPaste={onPaste}
              autoComplete="one-time-code"
              onSubmit={(event) => {
                event.preventDefault();
                submit(digits);
              }}
            >
              {digits.map((d, i) => (
                <input
                  key={`${i}-${shake}`}
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  type="password"
                  disabled={success || checking}
                  className={cn(
                    "h-14 w-12 rounded-lg border bg-black/40 text-center font-mono text-2xl font-bold text-[#f4f4ef] outline-none transition-all duration-200",
                    d !== "" && "animate-pin-pop",
                    success
                      ? "border-[#bef264] shadow-[0_0_22px_rgba(190,242,100,0.55)]"
                      : error
                        ? "border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)]"
                        : d !== ""
                          ? "border-[#ff3d00]/70 shadow-[0_0_16px_rgba(255,61,0,0.45)]"
                          : "border-white/15 focus:border-[#ff3d00] focus:shadow-[0_0_18px_rgba(255,61,0,0.4)]",
                  )}
                />
              ))}
            </form>
            <div aria-live="polite" className="relative mt-4 min-h-5">
              {success ? (
                <p className="font-mono text-[11px] tracking-[0.2em] text-[#bef264] uppercase">
                  Welcome back, chief ✓
                </p>
              ) : lockMsg ? (
                <p className="font-mono text-[11px] tracking-[0.2em] text-amber-300 uppercase">
                  {lockMsg}
                </p>
              ) : checking ? (
                <p className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">
                  Verifying…
                </p>
              ) : (
                <p
                  className={cn(
                    "font-mono text-[11px] tracking-[0.2em] uppercase transition-opacity",
                    error ? "text-red-400 opacity-100" : "opacity-0",
                  )}
                >
                  Wrong code — try again
                </p>
              )}
            </div>
            <div className="relative mt-1 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-[#8a8a82]/70 uppercase tabular-nums">
              <span>BUDI private area</span>
              <span>{attempts === 0 ? "No attempts" : `${attempts} miss${attempts > 1 ? "es" : ""}`}</span>
            </div>
            <p className="relative mt-4 border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.18em] text-white/30 uppercase">
              Tip — paste the 4-digit code · Enter unlocks
            </p>
            {onSwitchAccount && (
              <button
                type="button"
                onClick={onSwitchAccount}
                className="relative mt-3 cursor-pointer font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
              >
                ← Switch account · BUDI OS
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
          v1 · Local gate
        </p>
      </div>
    </div>
  );
}

export function logout(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem("budi-admin-secret");
  } catch {
    /* ignore */
  }
}
