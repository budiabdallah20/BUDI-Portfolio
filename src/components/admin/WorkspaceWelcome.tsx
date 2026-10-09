"use client";

import { Award, Briefcase, Cpu, FolderGit, PartyPopper, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import SmartImage from "@/components/SmartImage";

/**
 * First-open welcome for a brand-new dashboard account — even an empty
 * console gets a designed moment: the account's own logo, name, theme,
 * a greeting and the 4-step quick start. Dismiss once, never shown again
 * (flag: `budi-os-welcomed__<id>`).
 */
export default function WorkspaceWelcome({
  name,
  tagline,
  logo,
  theme,
  onEnter,
}: {
  name: string;
  tagline: string;
  logo: string;
  theme: string;
  onEnter: () => void;
}): React.JSX.Element {
  const steps = [
    { icon: Briefcase, title: "أضف خدماتك", sub: "Services tab" },
    { icon: Cpu, title: "سجّل مهاراتك", sub: "Skills tab" },
    { icon: FolderGit, title: "اعرض مشاريعك", sub: "Projects tab" },
    { icon: Award, title: "وثّق شهاداتك", sub: "Certificates tab" },
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${name}`}
      className="fixed inset-0 z-[125] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/12 bg-[#101012]/95 p-8 text-center text-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:p-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: `linear-gradient(180deg, ${theme}33 0%, transparent 100%)` }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${theme}, transparent)` }}
        />
        <span
          className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border bg-white"
          style={{ borderColor: `${theme}66`, boxShadow: `0 0 40px ${theme}55` }}
        >
          {logo !== "" ? (
            <span className="relative block h-full w-full p-1.5">
              <SmartImage src={logo} alt="" fill fit="contain" sizes="80px" />
            </span>
          ) : (
            <span className="scale-150">
              <Logo />
            </span>
          )}
        </span>

        <p
          className="relative mt-5 flex items-center justify-center gap-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: theme }}
        >
          <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
          حساب جديد · New account
        </p>
        <h2 className="font-display relative mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          أهلاً بيك في <span style={{ color: theme }}>{name}</span>
        </h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
          {tagline !== "" ? tagline : "لوحة تحكم جديدة فاضية ومستعدة — املاها بطريقتك."}
          <br />
          <span className="text-white/40">This console is yours: isolated data, own loader, own PIN.</span>
        </p>

        <div className="relative mt-6 grid grid-cols-2 gap-2 text-left">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black tabular-nums"
                style={{ backgroundColor: `${theme}1f`, color: theme }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                  <s.icon className="h-3.5 w-3.5 shrink-0" style={{ color: theme }} aria-hidden="true" />
                  {s.title}
                </p>
                <p className="font-mono text-[9px] tracking-[0.18em] text-white/35 uppercase">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onEnter}
          autoFocus
          className="relative mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black transition-all hover:-translate-y-0.5 hover:brightness-110"
          style={{ backgroundColor: theme, color: "#0a0a0b", boxShadow: `0 18px 50px -14px ${theme}` }}
        >
          افتح لوحة التحكم · Enter console
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="relative mt-3 font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">
          BUDI OS · isolated workspace
        </p>
      </div>
    </div>
  );
}
