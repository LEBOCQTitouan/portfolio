import { locales, type Locale } from "@/core/domain/locale";
import { script } from "./script";
import type { NarrationLine } from "./types";

function stripLocale(route: string): string {
  for (const l of locales) {
    if (route === `/${l}`) return "/";
    if (route.startsWith(`/${l}/`)) return route.slice(l.length + 1);
  }
  return route;
}

/** Returns the ordered narration lines for a route, or [] if none. */
export function getNarration(route: string, locale: Locale): NarrationLine[] {
  const path = stripLocale(route);
  const map = script[locale];
  if (path in map) return map[path];
  if (path.startsWith("/work/") && path !== "/work") return map["/work/[slug]"] ?? [];
  return [];
}
