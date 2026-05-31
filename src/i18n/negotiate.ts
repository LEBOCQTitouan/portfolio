import { defaultLocale, isLocale, locales, type Locale } from "./config";

/** Pick the highest-q-weight supported locale from an Accept-Language header. */
function fromAcceptLanguage(header: string): Locale | null {
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? Number(q.split("=")[1]) : 1;
      return { base: tag.trim().toLowerCase().split("-")[0], weight: Number.isFinite(weight) ? weight : 1 };
    })
    .filter((x) => x.base)
    .sort((a, b) => b.weight - a.weight);
  for (const { base } of ranked) {
    if (isLocale(base)) return base;
  }
  return null;
}

/** cookie > Accept-Language > default. */
export function negotiateLocale(cookie: string | null, acceptLanguage: string | null): Locale {
  if (cookie && isLocale(cookie)) return cookie;
  if (acceptLanguage) {
    const matched = fromAcceptLanguage(acceptLanguage);
    if (matched) return matched;
  }
  return defaultLocale;
}

export { locales, defaultLocale, type Locale };
