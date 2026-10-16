"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Check, X, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryInfo {
  name: string;
  count: number;
}

/**
 * CategoryManager — one card that covers every section:
 * - Projects: true add / rename / delete (delete reassigns items to a
 *   fallback instead of orphaning them).
 * - Services & Skills: fixed site enums can't be added/deleted (filters
 *   depend on them), so this edits their DISPLAY labels (catLabels) —
 *   rename only, which is exactly what the console supports.
 */
export default function CategoryManager({
  title,
  hint,
  categories,
  fixed = false,
  displayLabels,
  onRename,
  onDelete,
  onAdd,
  onLabelChange,
  accent = "#d7fd44",
}: {
  title: string;
  hint: string;
  categories: CategoryInfo[];
  /** true = enum is fixed (services/skills): rename labels only. */
  fixed?: boolean;
  displayLabels?: Record<string, string>;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string, moveTo: string) => void;
  onAdd: (name: string) => void;
  onLabelChange?: (value: string, label: string) => void;
  accent?: string;
}): React.JSX.Element {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");

  const sorted = useMemo(() => [...categories].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)), [categories]);
  const total = sorted.reduce((n, c) => n + c.count, 0);

  const clean = (s: string): string => s.trim().replace(/\s+/g, " ").slice(0, 40);
  const exists = (s: string): boolean => sorted.some((c) => c.name.toLowerCase() === s.toLowerCase());

  const submitAdd = (): void => {
    const name = clean(draft);
    if (name === "" || exists(name)) return;
    onAdd(name);
    setDraft("");
    setAdding(false);
  };

  const submitRename = (oldName: string): void => {
    const name = clean(editVal);
    if (name === "" || name === oldName) {
      setEditing(null);
      return;
    }
    if (exists(name)) {
      // Merge into existing — parent moves items.
      onRename(oldName, name);
    } else {
      onRename(oldName, name);
    }
    setEditing(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Tags className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
          <h4 className="font-display text-base font-bold">{title}</h4>
        </div>
        {!fixed && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.12em] uppercase text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            {adding ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
            {adding ? "Close" : "Add category"}
          </button>
        )}
      </div>
      <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-white/40 uppercase">{hint}</p>

      {adding && !fixed && (
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="e.g. PWA — Enter to add"
            maxLength={40}
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitAdd}
            disabled={clean(draft) === "" || exists(clean(draft))}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-black text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Add
          </button>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {sorted.length === 0 && <li className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center font-mono text-[10px] tracking-[0.14em] text-white/35 uppercase">No categories yet</li>}
        {sorted.map((c) => {
          const isEditing = editing === c.name;
          const isDeleting = deleting === c.name;
          const label = displayLabels?.[c.name] ?? "";
          return (
            <li key={c.name} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
                {isEditing ? (
                  <input
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename(c.name);
                      if (e.key === "Escape") setEditing(null);
                    }}
                    maxLength={40}
                    autoFocus
                    className="min-w-0 flex-1 rounded-md border border-white/20 bg-black/50 px-2 py-1 text-sm text-white focus:border-white/50 focus:outline-none"
                    aria-label={`Rename ${c.name}`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{fixed && label !== "" ? `${label} (${c.name})` : c.name}</span>
                )}
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60 tabular-nums">
                  {c.count}/{total}
                </span>
                {isEditing ? (
                  <>
                    <button type="button" onClick={() => submitRename(c.name)} aria-label="Save rename" className="cursor-pointer rounded-md p-1.5 text-emerald-300 transition-colors hover:bg-white/10">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setEditing(null)} aria-label="Cancel rename" className="cursor-pointer rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c.name);
                        setEditVal(fixed ? (label || c.name) : c.name);
                      }}
                      aria-label={fixed ? `Rename display label for ${c.name}` : `Rename ${c.name}`}
                      title={fixed ? "Rename display label" : "Rename category (moves all items)"}
                      className="cursor-pointer rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {!fixed && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(isDeleting ? null : c.name);
                          setMoveTo(sorted.find((x) => x.name !== c.name)?.name ?? "");
                        }}
                        aria-label={`Delete ${c.name}`}
                        title="Delete (reassign items first)"
                        className="cursor-pointer rounded-md p-1.5 text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </>
                )}
              </div>
              {fixed && onLabelChange && !isEditing && (
                <p className="mt-1 truncate font-mono text-[9px] tracking-[0.08em] text-white/30 uppercase">
                  Display label: {label === "" ? "(default)" : label} — tap ✎ to rename
                </p>
              )}
              {isDeleting && !fixed && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-2 font-mono text-[10px] text-white/50 uppercase">
                    Move {c.count} item(s) to
                    <select
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      className="min-w-0 flex-1 cursor-pointer rounded-md border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white normal-case"
                    >
                      <option value="">— General (clear) —</option>
                      {sorted.filter((x) => x.name !== c.name).map((x) => (
                        <option key={x.name} value={x.name}>{x.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(c.name, moveTo);
                        setDeleting(null);
                      }}
                      className="cursor-pointer rounded-md bg-red-500/90 px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.1em] text-white uppercase transition-transform hover:-translate-y-0.5"
                    >
                      Confirm delete
                    </button>
                    <button type="button" onClick={() => setDeleting(null)} className={cn("cursor-pointer rounded-md border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-white/60 uppercase hover:text-white")}>
                      Keep
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
