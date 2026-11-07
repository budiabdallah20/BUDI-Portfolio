"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, isLang, type Dictionary, type Lang } from "@/i18n/dictionaries";

interface LanguageValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Hard switch — persist + full reload to /{lang} (fresh open, like a first visit). */
  switchLanguage: (next: Lang) => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);
const STORAGE_KEY = "budi-lang";

function initialLang(): Lang {
  // Always default on first render (server AND client) so hydration matches.
  // The persisted language syncs in the effect below — one extra render,
  // zero mismatch warnings.
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // 1) Adopt the boot script's pre-paint choice ONCE after mount.
  //    Boot already resolved localStorage → <html lang>, so DOM is source of truth.
  useEffect(() => {
    const pathLang = window.location.pathname.split("/")[1];
    const fromDoc = isLang(pathLang) ? pathLang : isLang(document.documentElement.lang)
      ? document.documentElement.lang
      : null;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode — ignore */
    }
    if (!isLang(stored)) {
      try {
        const match = document.cookie.match(/(?:^|; )budi-lang=(en|fr)/);
        stored = match?.[1] ?? null;
      } catch {
        /* cookies blocked — ignore */
      }
    }
    if (isLang(fromDoc)) {
      setLangState((prev) => (prev === fromDoc ? prev : fromDoc));
    } else if (isLang(stored)) {
      setLangState((prev) => (prev === stored ? prev : stored));
    }
    // Run once — intentionally not depending on `lang`, otherwise
    // every toggle would read the stale DOM value and revert itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Persist every change: DOM + localStorage (+ cookie fallback).
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode — language simply won't persist */
    }
    try {
      // Secure only over HTTPS so the lang cookie is never sent in cleartext;
      // on http (localhost dev) we omit Secure so the cookie still works.
      const secure = location.protocol === "https:" ? ";Secure" : "";
      document.cookie = `${STORAGE_KEY}=${lang};max-age=31536000;path=/;SameSite=Lax${secure}`;
    } catch {
      /* cookies blocked — ignore */
    }
  }, [lang]);

  // 3) Follow language changes from other tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue;
      if (isLang(next)) {
        setLangState((prev) => (prev === next ? prev : next));
      }
    };
    window.addEventListener("storage", onStorage);
    return (): void => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);



  /**
   * Language lives in the URL path (/en, /fr). Switching must feel like a
   * fresh open — persist the choice, then let the browser do a real
   * navigation (full reload), never a soft in-place re-render.
   */
  const switchLanguage = useCallback((next: Lang): void => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the path itself carries the choice */
    }
    try {
      const secure = location.protocol === "https:" ? ";Secure" : "";
      document.cookie = `${STORAGE_KEY}=${next};max-age=31536000;path=/;SameSite=Lax${secure}`;
    } catch {
      /* cookies blocked — the path itself carries the choice */
    }
    try { window.sessionStorage.removeItem("budi-seen"); } catch { /* Navigation still works without storage. */ }
    window.location.assign(`/${next}`);
  }, []);

  const setLang = switchLanguage;

  const toggle = useCallback((): void => {
    switchLanguage(lang === "en" ? "fr" : "en");
  }, [lang, switchLanguage]);

  const value = useMemo<LanguageValue>(
    () => ({ lang, t: dictionaries[lang], setLang, toggle, switchLanguage }),
    [lang, setLang, toggle, switchLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
