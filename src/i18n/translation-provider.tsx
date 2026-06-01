"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

type Ctx = { dictionary: Dictionary; lang: Locale };
const TranslationContext = createContext<Ctx | null>(null);

export function TranslationProvider({
  dictionary,
  lang,
  children,
}: Ctx & { children: ReactNode }) {
  return (
    <TranslationContext.Provider value={{ dictionary, lang }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext(): Ctx {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useT must be used within TranslationProvider");
  return ctx;
}
