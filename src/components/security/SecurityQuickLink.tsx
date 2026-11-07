"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Transport = "https" | "local" | "http";

/**
 * Security quick link — the /security certificate, deliberately tiny:
 * a quiet icon-only badge in the bottom-left corner (mirroring the
 * back-to-top button on the right) instead of a wide footer pill.
 * Full details live on the certificate page; this is just the door.
 */
export default function SecurityQuickLink(): React.JSX.Element | null {
  const { lang } = useLanguage();
  const [transport, setTransport] = useState<Transport>("https");

  useEffect(() => {
    try {
      const host = window.location.hostname;
      if (window.location.protocol === "https:") {
        setTransport("https");
        return;
      }
      setTransport(host === "localhost" || host === "127.0.0.1" || host === "::1" ? "local" : "http");
    } catch {
      setTransport("https");
    }
  }, []);

  const label =
    lang === "fr"
      ? "Certificat de sécurité — HTTPS · HSTS · CSP"
      : "Security certificate — HTTPS · HSTS · CSP";

  const palette =
    transport === "http"
      ? "border-amber-400/35 text-amber-300/90 shadow-[0_8px_28px_-10px_rgba(251,191,36,0.4)] hover:border-amber-400/55 hover:text-amber-300"
      : "border-emerald-400/30 text-emerald-300/90 shadow-[0_8px_28px_-10px_rgba(52,211,153,0.45)] hover:border-emerald-400/50 hover:text-emerald-300";

  return (
    <Link
      href="/security"
      title={label}
      aria-label={label}
      className={`glass fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 sm:bottom-8 sm:left-8 ${palette}`}
    >
      <ShieldCheck className="h-5 w-5" aria-hidden="true" strokeWidth={2.1} />
    </Link>
  );
}
