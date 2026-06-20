"use client";
import { useTranslationContext } from "./translation-provider";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "@/core/domain/locale";

/** Client hook: returns the dictionary + active locale. */
export function useT(): { t: Dictionary; lang: Locale } {
  const { dictionary, lang } = useTranslationContext();
  return { t: dictionary, lang };
}
