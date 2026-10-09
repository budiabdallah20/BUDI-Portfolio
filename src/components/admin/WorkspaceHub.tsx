"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import {
  builtinWorkspace,
  createWorkspace,
  loadWorkspaces,
  removeWorkspace,
  saveWorkspace,
  type Workspace,
} from "./workspaces";

const THEME_PRESETS = ["#ff3d00", "#38bdf8", "#d7fd44", "#a78bfa", "#25d366", "#fb7185"];

function lastOpenLabel(ws: Workspace): string {
  if (!ws.lastOpenedAt) return "Never opened yet";
  try {
    const d = new Date(ws.lastOpenedAt);
    return `Last open ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "Last open unknown";
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Logo too big — 2MB max."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (): void => resolve(String(reader.result));
    reader.onerror = (): void => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

/**
 * BUDI OS hub — pick one of up to 100 dashboard accounts.
 * Builtin BUDI Portfolio opens the full console; external accounts
 * open their linked dashboard URL (their data lives in their own DB —
 * the hub only keeps the login ledger).
 */
export default function WorkspaceHub({
  list,
  onList,
  onOpen,
  onExitLast,
}: {
  list: Workspace[];
  onList: (next: Workspace[]) => void;
  onOpen: (ws: Workspace) => void;
  onExitLast?: () => void;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [theme, setTheme] = useState("#ff3d00");
  const [pin, setPin] = useState("");
  const [kind, setKind] = useState<"builtin" | "external">("builtin");
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [logo, setLogo] = useState("");
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) => w.name.toLowerCase().includes(q) || w.tagline.toLowerCase().includes(q),
    );
  }, [list, query]);

  const openModal = (m: NonNullable<typeof modal>): void => {
    setFormErr(null);
    setLogoErr(null);
    if (m.mode === "add") {
      setName("");
      setTagline("");
      setTheme("#ff3d00");
      setPin("");
      setKind("builtin");
      setDashboardUrl("");
      setLogo("");
    } else {
      const ws = list.find((w) => w.id === m.id);
      if (!ws) return;
      setName(ws.name);
      setTagline(ws.tagline);
      setTheme(ws.theme);
      setPin(ws.pin);
      setKind(ws.kind);
      setDashboardUrl(ws.dashboardUrl);
      setLogo(ws.logo);
    }
    setModal(m);
  };

  const submit = (): void => {
    if (name.trim() === "") {
      setFormErr("Name is required.");
      return;
    }
    if (pin !== "" && !/^\d{4}$/.test(pin)) {
      setFormErr("PIN must be exactly 4 digits (or empty = 2909).");
      return;
    }
    if (kind === "external") {
      if (!/^https?:\/\/.+/i.test(dashboardUrl.trim())) {
        setFormErr("External dashboards need a full https:// URL.");
        return;
      }
    }
    if (modal?.mode === "add") {
      createWorkspace({
        name: name.trim(),
        tagline: tagline.trim(),
        logo: logo.trim(),
        theme,
        pin: pin === "" ? "2909" : pin,
        kind,
        dashboardUrl: dashboardUrl.trim(),
      });
      onList(loadWorkspaces());
    } else if (modal?.mode === "edit") {
      const ws = list.find((w) => w.id === modal.id);
      if (!ws) return;
      const isBuiltin = ws.id === builtinWorkspace().id;
      const next: Workspace = {
        ...ws,
        name: isBuiltin ? ws.name : name.trim(),
        tagline: tagline.trim(),
        logo: logo.trim(),
        theme,
        // Main console PIN lives on the server (/api/admin/verify) —
        // the hub never rewrites it, so the gate can't desync.
        pin: isBuiltin ? ws.pin : pin === "" ? "2909" : pin,
        kind: isBuiltin ? "builtin" : kind,
        dashboardUrl: dashboardUrl.trim(),
      };
      onList(saveWorkspace(next));
    }
    setModal(null);
  };

  const onLogoFile = (file: File | undefined): void => {
    if (!file) return;
    setLogoErr(null);
    void readFileAsDataURL(file)
      .then(setLogo)
      .catch((e: unknown) => setLogoErr(e instanceof Error ? e.message : "Could not read file."));
  };

  return (
    <div className="min-h-svh bg-[#0a0a0b] text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="relative flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden="true"
              className="animate-spin-conic absolute inset-0 rounded-full opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, #ff3d00 20%, #d7fd44 40%, transparent 60%, transparent 75%, #38bdf8 90%, transparent 100%)",
                filter: "blur(5px)",
              }}
            />
            <span aria-hidden="true" className="absolute inset-[3px] rounded-full bg-[#0a0a0b]" />
            <span className="relative scale-125">
              <Logo />
            </span>
          </span>
          <h1 className="font-display mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            BUDI <span className="text-accent">OS</span>
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
            مركز قيادة المشاريع · {list.length}/100 workspaces
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55">
            One app, every dashboard — pick an account to open its own console, loader and PIN.
          </p>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-2xl items-center gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition-colors focus-within:border-[#ff3d00]/60">
            <Search className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
            <span className="sr-only">Search workspaces</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accounts… (Kayan, Massar…)"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
            {query !== "" && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="cursor-pointer text-white/35 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => openModal({ mode: "add" })}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#ff3d00] px-4 py-3 text-sm font-black text-[#1a0e05] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(255,61,0,0.8)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add account</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
            No account matches — try another word, or add it.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ws) => {
              const builtin = ws.id === builtinWorkspace().id;
              return (
                <article
                  key={ws.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
                  style={{ boxShadow: `0 0 0 rgba(0,0,0,0)` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 20px 60px -24px ${ws.theme}66`;
                    e.currentTarget.style.borderColor = `${ws.theme}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.borderColor = "";
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${ws.theme}1f 0%, transparent 55%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-[3px] w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full"
                    style={{ backgroundImage: `linear-gradient(to right, ${ws.theme}, transparent)` }}
                  />
                  <div className="relative flex items-start gap-3">
                    <span
                      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
                      style={{
                        borderColor: `${ws.theme}55`,
                        backgroundColor: `${ws.theme}14`,
                        boxShadow: `0 0 24px ${ws.theme}44`,
                      }}
                    >
                      {ws.logo !== "" ? (
                        <SmartImage src={ws.logo} alt="" fill fit="contain" sizes="56px" />
                      ) : (
                        <span className="scale-125">
                          <Logo />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display truncate text-lg font-bold">{ws.name}</h2>
                      <p className="truncate text-xs text-white/45">{ws.tagline || "—"}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] uppercase"
                          style={{
                            borderColor: `${ws.theme}66`,
                            backgroundColor: `${ws.theme}14`,
                            color: ws.theme,
                          }}
                        >
                          {builtin ? "Main" : ws.kind === "external" ? "Linked" : "Local"}
                        </span>
                        {ws.kind === "external" && (
                          <span
                            title={ws.dashboardUrl}
                            className="flex max-w-full items-center gap-1 truncate font-mono text-[9px] text-white/35"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate" dir="ltr">
                              {ws.dashboardUrl.replace(/^https?:\/\//, "").slice(0, 28)}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="relative mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.08em] text-white/35 uppercase">
                    <span>{lastOpenLabel(ws)}</span>
                    <span className="tabular-nums">×{ws.openCount}</span>
                  </p>
                  <div className="relative mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => onOpen(ws)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5 hover:brightness-110"
                      style={{ backgroundColor: ws.theme, color: "#0a0a0b" }}
                    >
                      دخول · Enter
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal({ mode: "edit", id: ws.id })}
                      aria-label={`Edit ${ws.name}`}
                      title="Edit account"
                      className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {!builtin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${ws.name}"? Its local data is wiped too.`)) {
                            onList(removeWorkspace(ws.id));
                          }
                        }}
                        aria-label={`Delete ${ws.name}`}
                        title="Delete account"
                        className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-red-500/60 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {onExitLast && (
          <p className="mt-8 text-center">
            <button
              type="button"
              onClick={onExitLast}
              className="cursor-pointer font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase hover:text-white/60"
            >
              Forget last-opened account
            </button>
          </p>
        )}
      </div>

      {/* Add / edit account */}
      {modal !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modal.mode === "add" ? "Add account" : "Edit account"}
          onClick={() => setModal(null)}
          className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#131316] p-6 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{ borderColor: `${theme}55`, backgroundColor: `${theme}1a`, color: theme }}
              >
                <LayoutGrid className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-xl font-black">
                  {modal.mode === "add" ? "New dashboard account" : "Edit account"}
                </h3>
                <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
                  Meta + login record only — project data stays in its own DB
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                  Name *
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kayan — dashboard"
                  maxLength={60}
                  disabled={modal.mode === "edit" && list.find((w) => w.id === modal.id)?.id === builtinWorkspace().id}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ff3d00] disabled:opacity-50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                  Tagline
                </span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Student OS console"
                  maxLength={120}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ff3d00]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                    PIN (4 digits)
                    {modal.mode === "edit" &&
                      list.find((w) => w.id === modal.id)?.id === builtinWorkspace().id &&
                      " · server-owned"}
                  </span>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="2909"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={modal.mode === "edit" && list.find((w) => w.id === modal.id)?.id === builtinWorkspace().id}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm tracking-[0.3em] text-white outline-none placeholder:text-white/25 focus:border-[#ff3d00] disabled:opacity-50"
                  />
                </label>
                <div>
                  <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                    Theme
                  </span>
                  <div className="flex items-center gap-1.5">
                    {THEME_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTheme(c)}
                        aria-label={`Theme ${c}`}
                        aria-pressed={theme === c}
                        className={cn(
                          "h-9 w-9 cursor-pointer rounded-lg border transition-transform hover:scale-110",
                          theme === c ? "border-white" : "border-transparent",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      aria-label="Custom theme color"
                      className="h-9 w-9 cursor-pointer rounded-lg border border-white/15 bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
                {(["builtin", "external"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    disabled={modal.mode === "edit" && list.find((w) => w.id === (modal as { id: string }).id)?.id === builtinWorkspace().id}
                    className={cn(
                      "flex-1 cursor-pointer rounded-lg px-3 py-2 font-mono text-[10px] font-black tracking-[0.12em] uppercase transition-all disabled:opacity-40",
                      kind === k ? "bg-white text-black" : "text-white/45 hover:text-white",
                    )}
                  >
                    {k === "builtin" ? "Local console" : "Linked URL"}
                  </button>
                ))}
              </div>
              {kind === "external" && (
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                    Dashboard URL *
                  </span>
                  <input
                    value={dashboardUrl}
                    onChange={(e) => setDashboardUrl(e.target.value.trim())}
                    placeholder="https://kayan.vercel.app/admin"
                    dir="ltr"
                    maxLength={500}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ff3d00]"
                  />
                </label>
              )}
              <div>
                <span className="mb-1.5 block font-mono text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">
                  Logo (optional)
                </span>
                <div className="flex items-center gap-2">
                  {logo !== "" && (
                    <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white">
                      <SmartImage src={logo} alt="" fill fit="contain" sizes="44px" />
                    </span>
                  )}
                  <input
                    value={logo.startsWith("data:") ? "" : logo}
                    onChange={(e) => {
                      setLogo(e.target.value.trim());
                      setLogoErr(null);
                    }}
                    placeholder="/icons/kayan.svg or https://…"
                    dir="ltr"
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white outline-none placeholder:text-white/25 focus:border-[#ff3d00]"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0 cursor-pointer rounded-xl border border-white/15 px-3 py-3 text-xs font-bold text-white/70 hover:border-white/35 hover:text-white"
                  >
                    Upload
                  </button>
                  {logo !== "" && (
                    <button
                      type="button"
                      onClick={() => setLogo("")}
                      className="shrink-0 cursor-pointer font-mono text-[10px] text-white/35 uppercase hover:text-red-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {logoErr && <p className="mt-1.5 text-xs text-red-300">{logoErr}</p>}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  aria-label="Logo file picker"
                  onChange={(e) => onLogoFile(e.target.files?.[0])}
                />
              </div>
              {formErr && (
                <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {formErr}
                </p>
              )}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 cursor-pointer rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 hover:border-white/35 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#ff3d00] px-4 py-3 text-sm font-black text-[#1a0e05] hover:brightness-110"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {modal.mode === "add" ? "Create account" : "Save"}
                </button>
              </div>
              <p className="flex items-center justify-center gap-1 text-center font-mono text-[9px] text-white/30">
                Opens in a new tab for linked URLs
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
