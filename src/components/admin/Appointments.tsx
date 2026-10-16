"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appt {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note: string;
  done: boolean;
}

const KEY = "budi-admin-appointments";

function load(): Appt[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
      .slice(0, 200)
      .map((a, i) => ({
        id: typeof a.id === "string" ? a.id : `appt-${i}`,
        title: typeof a.title === "string" ? a.title.slice(0, 80) : "",
        date: typeof a.date === "string" ? a.date.slice(0, 10) : "",
        time: typeof a.time === "string" ? a.time.slice(0, 5) : "",
        note: typeof a.note === "string" ? a.note.slice(0, 200) : "",
        done: a.done === true,
      }))
      .filter((a) => a.title !== "" && a.date !== "");
  } catch {
    return [];
  }
}

/**
 * Appointments — tiny beloved calendar. Local-first (this console only):
 * add / edit / done / delete, sorted by date, upcoming on top.
 */
export default function Appointments(): React.JSX.Element {
  const [items, setItems] = useState<Appt[]>([]);
  const [form, setForm] = useState({ title: "", date: "", time: "", note: "" });
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    setItems(load());
  }, []);

  const persist = (next: Appt[]): void => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  };

  const sorted = useMemo(() => [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [items]);
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sorted.filter((a) => !a.done && a.date >= today).slice(0, 5);
  }, [sorted]);

  const submit = (): void => {
    const title = form.title.trim().slice(0, 80);
    if (title === "" || form.date === "") return;
    if (editing) {
      persist(items.map((a) => (a.id === editing ? { ...a, title, date: form.date, time: form.time, note: form.note.trim().slice(0, 200) } : a)));
      setEditing(null);
    } else {
      persist([...items, { id: `appt-${Date.now().toString(36)}`, title, date: form.date, time: form.time, note: form.note.trim().slice(0, 200), done: false }]);
    }
    setForm({ title: "", date: "", time: "", note: "" });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-[#38bdf8] uppercase">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        Appointments · {upcoming.length} upcoming
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_110px]">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Call with client — project kickoff"
          maxLength={80}
          aria-label="Appointment title"
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/40 focus:outline-none"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          aria-label="Appointment date"
          className="cursor-pointer rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
        />
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          aria-label="Appointment time"
          className="cursor-pointer rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Note (optional)…"
          maxLength={200}
          aria-label="Appointment note"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={form.title.trim() === "" || form.date === ""}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#38bdf8] px-4 py-2 text-xs font-black text-[#06222e] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {editing ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          {editing ? "Save" : "Add"}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setForm({ title: "", date: "", time: "", note: "" }); }} aria-label="Cancel edit" className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-white/60 hover:text-white">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {sorted.length === 0 && (
          <li className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center font-mono text-[10px] tracking-[0.14em] text-white/35 uppercase">
            No appointments — plan your first one above ♥
          </li>
        )}
        {sorted.slice(0, 8).map((a) => (
          <li key={a.id} className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5", a.done ? "border-white/5 bg-black/20 opacity-55" : "border-white/10 bg-black/30")}>
            <button
              type="button"
              onClick={() => persist(items.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)))}
              aria-label={a.done ? `Mark ${a.title} not done` : `Mark ${a.title} done`}
              aria-pressed={a.done}
              className={cn(
                "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
                a.done ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/30 text-transparent hover:border-emerald-400",
              )}
            >
              <Check className="h-3 w-3" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-bold", a.done && "line-through")}>{a.title}</p>
              <p className="font-mono text-[10px] text-white/40 tabular-nums" dir="ltr">
                {a.date}{a.time !== "" ? ` · ${a.time}` : ""}{a.note !== "" ? ` · ${a.note}` : ""}
              </p>
            </div>
            <button type="button" onClick={() => { setEditing(a.id); setForm({ title: a.title, date: a.date, time: a.time, note: a.note }); }} aria-label={`Edit ${a.title}`} className="cursor-pointer rounded-md p-1.5 text-white/45 hover:bg-white/10 hover:text-white">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => persist(items.filter((x) => x.id !== a.id))} aria-label={`Delete ${a.title}`} className="cursor-pointer rounded-md p-1.5 text-white/45 hover:bg-red-500/15 hover:text-red-300">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
