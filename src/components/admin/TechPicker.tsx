"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import { TECH_PRESETS } from "@/data/techPresets";

const KIND_LABEL: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
};

/**
 * Tech multi-picker — replaces free-text stack typing. Sources, in order:
 * 1) this account's own skills (suggestions), 2) the 50 famous presets
 * (searchable), 3) a custom entry. Enforces max items + 30-char names so
 * every save passes client + server validation.
 */
export default function TechPicker({
  selected,
  onChange,
  suggestions,
  max = 14,
  accent = "#ff3d00",
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  /** This account's skill names — offered first, above the presets. */
  suggestions?: string[];
  max?: number;
  accent?: string;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const has = (name: string): boolean =>
    selected.some((s) => s.toLowerCase() === name.toLowerCase());

  const toggle = (name: string): void => {
    const clean = name.trim().slice(0, 30);
    if (clean === "") return;
    if (has(clean)) {
      onChange(selected.filter((s) => s.toLowerCase() !== clean.toLowerCase()));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, clean]);
  };

  const addCustom = (): void => {
    toggle(custom);
    setCustom("");
  };

  const q = query.trim().toLowerCase();
  const ownSkills = useMemo(
    () =>
      (suggestions ?? [])
        .map((s) => s.trim())
        .filter((s) => s !== "" && (!q || s.toLowerCase().includes(q)))
        .slice(0, 12),
    [suggestions, q],
  );
  const presets = useMemo(() => {
    const kinds = ["language", "framework", "tool"] as const;
    return kinds
      .map((kind) => ({
        kind,
        items: TECH_PRESETS.filter(
          (p) => p.kind === kind && (!q || p.name.toLowerCase().includes(q)),
        ).slice(0, q ? 24 : 8),
      }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      {/* Selected */}
      {selected.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5" aria-live="polite">
          {selected.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold"
              style={{ borderColor: `${accent}66`, backgroundColor: `${accent}14`, color: accent }}
            >
              {t}
              <button
                type="button"
                onClick={() => toggle(t)}
                aria-label={`Remove ${t}`}
                className="cursor-pointer opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/30" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills & the top-50 tech…"
          className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pr-3 pl-9 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/35"
        />
      </div>
      {/* Account skills first */}
      {ownSkills.length > 0 && (
        <div className="mt-2.5">
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.22em] text-white/40 uppercase">
            From this account
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ownSkills.map((s) => {
              const active = has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  aria-pressed={active}
                  className={cn(
                    "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5",
                    active
                      ? "border-transparent text-black"
                      : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/35 hover:text-white",
                  )}
                  style={active ? { backgroundColor: accent } : undefined}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Presets by kind */}
      {presets.map((g) => (
        <div key={g.kind} className="mt-2.5">
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.22em] text-white/40 uppercase">
            {KIND_LABEL[g.kind]}
          </p>
          <div className="grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
            {g.items.map((p) => {
              const active = has(p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => toggle(p.name)}
                  aria-pressed={active}
                  title={p.name}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all hover:-translate-y-0.5",
                    active
                      ? "border-transparent"
                      : "border-white/10 bg-white/[0.03] hover:border-white/30",
                  )}
                  style={
                    active
                      ? { backgroundColor: `${accent}22`, borderColor: `${accent}88` }
                      : undefined
                  }
                >
                  {p.logo !== "" ? (
                    <span className="relative block h-5 w-5 shrink-0">
                      <SmartImage src={p.logo} alt="" fill fit="contain" sizes="20px" />
                    </span>
                  ) : (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-black"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                      aria-hidden="true"
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 truncate text-xs font-bold text-white/80">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {/* Custom */}
      <div className="mt-2.5 flex gap-1.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.slice(0, 30))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom tech… (Enter to add)"
          maxLength={30}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/35"
        />
        <button
          type="button"
          onClick={addCustom}
          aria-label="Add custom tech"
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:border-white/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add
        </button>
      </div>
      <p className="mt-2 font-mono text-[9px] tracking-[0.14em] text-white/30 uppercase tabular-nums">
        {selected.length}/{max} picked
      </p>
    </div>
  );
}
