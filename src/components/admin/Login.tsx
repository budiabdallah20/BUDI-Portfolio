"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { storeSecret } from "./remote";

const AUTH_KEY = "budi-admin";

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function logout(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem("budi-admin-secret");
  } catch {
    /* ignore */
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

/**
 * Single control-center gate — server-side PIN verification only.
 * No multi-account, no per-workspace PINs. Protected by /api/admin/verify.
 */
export default function Login({
  onAuthed,
}: {
  onAuthed: () => void;
}): React.JSX.Element {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  /** The SERVER couldn't verify at all (missing/quoted ADMIN_API_SECRET) —
   *  a completely different failure from a typo, and one the owner can fix
   *  without touching code. Gets its own call-to-action below the form. */
  const [misconfigured, setMisconfigured] = useState(false);
  const [shake, setShake] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const doneRef = useRef(onAuthed);
  doneRef.current = onAuthed;

  useEffect(() => {
    if (isAuthed()) {
      onAuthed();
      return;
    }
    window.setTimeout(() => boxes.current[0]?.focus(), 120);
  }, [onAuthed]);

  const fail = (): void => {
    setError(true);
    setShake((s) => s + 1);
    setAttempts((a) => a + 1);
    setDigits(["", "", "", ""]);
    window.setTimeout(() => boxes.current[0]?.focus(), 80);
    window.setTimeout(() => setError(false), 1700);
  };

  const win = (secret: string): void => {
    setSuccess(true);
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(AUTH_KEY, "1");
        storeSecret(secret);
      } catch {
        /* session-only fallback */
      }
      doneRef.current();
    }, 550);
  };

  const submit = (values: string[]): void => {
    if (success || checking) return;
    if (values.some((d) => d === "")) return;
    const pin = values.join("");
    setChecking(true);
    setLockMsg(null);
    setMisconfigured(false);
    void (async (): Promise<void> => {
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: pin }),
        });
        setChecking(false);
        if (res.ok) {
          let ok = false;
          try {
            ok = ((await res.json()) as { ok?: unknown }).ok === true;
          } catch {
            /* non-JSON */
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
          // The server knows EXACTLY why it can't verify — don't throw that
          // away and show a generic "wrong PIN" instead. A deployment with no
          // ADMIN_API_SECRET (or a value saved with quotes) answers 500, and
          // until now it looked identical to a typo. Surface the real reason
          // and point at the diagnostics that prove it.
          let msg = "Server not configured — ADMIN_API_SECRET missing or malformed";
          try {
            const j = (await res.json()) as { error?: string };
            if (j.error) msg = j.error;
          } catch {
            /* keep default */
          }
          setLockMsg(msg);
          setMisconfigured(true);
          fail();
          return;
        }
        fail();
      } catch {
        setChecking(false);
        setLockMsg("Offline — connect and retry");
        fail();
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
  const accent = "#ff3d00";

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
              <Logo />
            </div>
            <h1 className="font-display relative mt-3 text-2xl font-bold text-[#f4f4ef]">
              Control Center Access
            </h1>
            <p className="relative mt-1.5 flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.3em] text-[#8a8a82] uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-[#bef264]" aria-hidden="true" />
              Enter the access code
            </p>

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
                  name={`pin-digit-${i + 1}`}
                  // text + CSS masking instead of type="password": four
                  // password inputs in one form trigger Chrome's "multiple
                  // password forms" DOM warning. Visually identical (dots).
                  type="text"
                  disabled={success || checking}
                  className={cn(
                    "pin-mask h-14 w-12 rounded-lg border bg-black/40 text-center font-mono text-2xl font-bold text-[#f4f4ef] outline-none transition-all duration-200",
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
                  Welcome — opening control center ✓
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

            {/* Deployment misconfiguration ≠ a typo. This block only exists
                when the SERVER answered 500, and it hands the owner the one
                link that proves what's actually wrong. */}
            {misconfigured && (
              <div className="relative mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-left">
                <p className="font-mono text-[10px] tracking-[0.18em] text-amber-300 uppercase">
                  проблемة من السيرفر مش من الكود
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-amber-100/70">
                  السيرفر شغال بس مفيش له قيمة <code className="text-amber-200">ADMIN_API_SECRET</code>{" "}
                   صح في بيئة النشر. افتح التشخيص وأنا أقولك بالظبط أنهي متغيّر ناقص:
                </p>
                <a
                  href="/api/admin/diagnose"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 font-mono text-[10px] tracking-[0.15em] text-amber-200 uppercase transition-colors hover:bg-amber-400/20"
                >
                  <Activity className="h-3 w-3" aria-hidden="true" />
                  افحص إعدادات النشر
                </a>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
          v1 · Control center gate
        </p>
      </div>
    </div>
  );
}
