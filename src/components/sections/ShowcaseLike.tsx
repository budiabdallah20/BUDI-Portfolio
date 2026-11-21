"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function ShowcaseLike({ id, total, fr }: { id: string; total?: number; fr: boolean }) {
  const key = "budi:showcase-appreciation:" + id;
  const [liked, setLiked] = useState(false);
  const [authority, setAuthority] = useState<number>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const count = authority ?? total;

  useEffect(() => {
    try { setLiked(localStorage.getItem(key) === "1"); } catch { /* storage optional */ }
  }, [key]);

  async function toggle() {
    if (pending) return;
    const previous = liked;
    const next = !liked;
    setLiked(next);
    setError(false);
    if (total !== undefined) {
      setPending(true);
      const previousAuthority = authority;
      setAuthority(Math.max(0, (count ?? total) + (next ? 1 : -1)));
      try {
        const response = await fetch("/api/engagement/like", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: id, action: next ? "like" : "unlike" }),
        });
        const result = await response.json() as { count?: number };
        if (!response.ok || typeof result.count !== "number") throw Error("Vote unavailable");
        setAuthority(result.count);
      } catch {
        setLiked(previous);
        setAuthority(previousAuthority);
        setError(true);
        return;
      } finally {
        setPending(false);
      }
    }
    try { if (next) localStorage.setItem(key, "1"); else localStorage.removeItem(key); } catch { /* storage optional */ }
  }

  return <div className="showcase-like">
    <button type="button" aria-pressed={liked} aria-busy={pending} onClick={() => void toggle()} className="showcase-action">
      <Heart size={15} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
      {fr ? "J’aime" : "Like"} {count !== undefined && <span aria-live="polite">{count.toLocaleString(fr ? "fr" : "en")}</span>}
    </button>
    {total === undefined && <small>{fr ? "Sur cet appareil" : "On this device"}</small>}
    {error && <small role="status">{fr ? "Vote indisponible. Réessayez." : "Vote unavailable. Try again."}</small>}
  </div>;
}
