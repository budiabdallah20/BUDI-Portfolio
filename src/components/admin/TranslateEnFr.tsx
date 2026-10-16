"use client";

import { useMemo, useState } from "react";
import { Check, Languages, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateEnToFr } from "@/lib/translate";

export interface FrPair {
  en: string | string[];
  fr: string | string[];
  apply: (v: string | string[]) => void;
}

/**
 * "Translate EN → FR" — one tap fills French fields from English twins.
 * - Default: only EMPTY French fields (never touches your edits).
 * - Overwrite toggle: re-translate everything (fixes stale French copy).
 * Chain: MyMemory → Google fallback, 12 jobs max per tap, gentle gaps.
 */
export default function TranslateEnFr({
  pairs,
  accent = "#38bdf8",
}: {
  pairs: FrPair[];
  accent?: string;
}): React.JSX.Element {
  const [overwrite, setOverwrite] = useState(false);
  const [state, setState] = useState<
    | { name: "idle" }
    | { name: "working"; done: number; total: number }
    | { name: "done"; count: number }
    | { name: "error"; msg: string; done: number; total: number }
  >({ name: "idle" });

  const emptyCount = useMemo(() => {
    let n = 0;
    for (const p of pairs) {
      if (Array.isArray(p.en)) {
        const frArr = Array.isArray(p.fr) ? p.fr : [];
        p.en.forEach((t, i) => {
          if (t.trim() !== "" && (frArr[i] ?? "").trim() === "") n += 1;
        });
      } else if (p.en.trim() !== "" && String(p.fr ?? "").trim() === "") n += 1;
    }
    return n;
  }, [pairs]);

  const run = (): void => {
    if (state.name === "working") return;
    const jobs: { pair: number; index: number; text: string }[] = [];
    pairs.forEach((p, pi) => {
      if (Array.isArray(p.en)) {
        const frArr = Array.isArray(p.fr) ? p.fr : [];
        p.en.forEach((t, i) => {
          if (t.trim() === "") return;
          if (overwrite || (frArr[i] ?? "").trim() === "") jobs.push({ pair: pi, index: i, text: t });
        });
      } else if (p.en.trim() !== "") {
        if (overwrite || String(p.fr ?? "").trim() === "") jobs.push({ pair: pi, index: -1, text: p.en });
      }
    });
    if (jobs.length === 0) {
      setState({ name: "done", count: 0 });
      window.setTimeout(() => setState({ name: "idle" }), 2200);
      return;
    }
    const batch = jobs.slice(0, 12);
    setState({ name: "working", done: 0, total: batch.length });
    void (async (): Promise<void> => {
      const scalarOut = new Map<number, string>();
      const listOut = new Map<number, { base: string[]; idx: number; val: string }[]>();
      let done = 0;
      for (const j of batch) {
        try {
          const fr = await translateEnToFr(j.text);
          if (j.index === -1) scalarOut.set(j.pair, fr);
          else {
            const p = pairs[j.pair]!;
            const base = [...(Array.isArray(p.fr) ? p.fr : [])];
            while (base.length <= j.index) base.push("");
            const cur = listOut.get(j.pair) ?? [];
            cur.push({ base, idx: j.index, val: fr });
            listOut.set(j.pair, cur);
          }
          done += 1;
          setState({ name: "working", done, total: batch.length });
        } catch (e) {
          for (const [pi, v] of scalarOut) pairs[pi]!.apply(v);
          for (const [pi, edits] of listOut) {
            const merged = [...edits[0]!.base];
            for (const ed of edits) merged[ed.idx] = ed.val;
            pairs[pi]!.apply(merged);
          }
          setState({
            name: "error",
            msg: e instanceof Error ? e.message : "Translation failed.",
            done,
            total: batch.length,
          });
          return;
        }
        await new Promise((r) => window.setTimeout(r, 350));
      }
      for (const [pi, v] of scalarOut) pairs[pi]!.apply(v);
      for (const [pi, edits] of listOut) {
        const merged = [...edits[0]!.base];
        for (const ed of edits) merged[ed.idx] = ed.val;
        pairs[pi]!.apply(merged);
      }
      setState({ name: "done", count: batch.length });
      window.setTimeout(() => setState({ name: "idle" }), 2600);
    })();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={state.name === "working"}
        title={emptyCount === 0 && !overwrite ? "All French fields are filled" : `${emptyCount} empty French field(s) — tap to fill`}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 font-mono text-[10px] font-black tracking-[0.14em] uppercase transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60",
          state.name === "error"
            ? "border-red-500/50 bg-red-500/10 text-red-300"
            : state.name === "done"
              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
              : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/40 hover:text-white",
        )}
        style={
          state.name === "idle" || state.name === "working"
            ? { borderColor: `${accent}55`, color: accent }
            : undefined
        }
      >
        {state.name === "working" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : state.name === "done" ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {state.name === "working"
          ? `Translating ${state.done}/${state.total}…`
          : state.name === "done"
            ? state.count === 0
              ? "French already filled ✓"
              : `✓ ${state.count} translated`
            : emptyCount > 0
              ? `Translate EN → FR (${emptyCount})`
              : "Translate EN → FR"}
      </button>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-white/50 uppercase transition-colors hover:border-white/30 hover:text-white">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
          className="h-3 w-3 accent-[#38bdf8]"
          aria-label="Overwrite filled French fields too"
        />
        Overwrite
      </label>
      {state.name === "error" && (
        <p role="alert" className="font-mono text-[10px] text-red-300">
          {state.msg} ({state.done}/{state.total} kept)
        </p>
      )}
    </div>
  );
}
