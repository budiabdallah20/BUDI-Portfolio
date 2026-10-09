"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "./LanguageProvider";

/** Client-side providers — single ember-dark theme, bilingual content. */
export default function AppProviders({ children }: { children: ReactNode }): React.JSX.Element {
  return <LanguageProvider>{children}</LanguageProvider>;
}
