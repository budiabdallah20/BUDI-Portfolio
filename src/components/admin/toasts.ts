"use client";

/**
 * Chic admin toasts — event-bus based so ANY console piece (Dashboard,
 * SettingsTab, editors, the runtime-error trap) can notify without prop
 * drilling. Replaces blocking window.alert for feedback; window.confirm
 * stays for destructive actions (blocking there is correct).
 */

export type ToastKind = "ok" | "err" | "info";

export interface ToastMsg {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

export const TOAST_EVENT = "budi-toast";

let seq = 0;
const lastSeen = new Map<string, number>();

/** Show a toast. Burst-deduped: same kind+title within 5s shows once. */
export function notify(kind: ToastKind, title: string, body?: string): void {
  try {
    if (typeof window === "undefined") return;
    const clean = title.trim().slice(0, 140);
    if (clean === "") return;
    const key = `${kind}|${clean}`;
    const now = Date.now();
    if (now - (lastSeen.get(key) ?? 0) < 5000) return;
    lastSeen.set(key, now);
    seq += 1;
    window.dispatchEvent(
      new CustomEvent<ToastMsg>(TOAST_EVENT, {
        detail: { id: seq, kind, title: clean, body: body?.trim().slice(0, 280) || undefined },
      }),
    );
  } catch {
    /* toast bus unavailable — callers already handle their own fallbacks */
  }
}
