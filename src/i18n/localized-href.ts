import type { Locale } from "./config";
/** Prefix an app path with the active locale: localizedHref("fr","/work") -> "/fr/work". */
export function localizedHref(lang: Locale, path: string): string {
  return `/${lang}${path === "/" ? "" : path}`;
}
