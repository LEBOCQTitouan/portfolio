/** The set of languages the site speaks. Which locales exist — and which one
 *  is the default — is a product decision, so it lives in the domain. The
 *  machinery that negotiates, loads dictionaries, and renders translations
 *  (src/i18n) is an outer layer that depends on this. */
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
