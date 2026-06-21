import { z } from "zod";
import { type Locale } from "@/core/domain/locale";

/** Open the stale-nag issue once the page is older than this many days. Single
 *  source of truth — the CI workflow reads it from here (see Task 5). */
export const STALE_AFTER_DAYS = 45;

const focusSchema = z.array(z.string().min(1)).min(1);

export const nowSchema = z.object({
  // ISO calendar date, e.g. "2026-06-21". If z.iso.date() is unavailable in the
  // installed zod, fall back to z.string().date().
  updated: z.iso.date(),
  focus: z.object({
    en: focusSchema,
    fr: focusSchema,
  }),
});

export type NowContent = z.infer<typeof nowSchema>;

const raw = {
  updated: "2026-06-21", // ← bump this whenever the focus list changes; it drives A and B
  focus: {
    en: [
      "Building this portfolio — and writing about where systems thinking meets interface craft.",
      "Going deeper on distributed-systems reliability.",
      "Exploring the edges of polished, accessible web UI.",
    ],
    fr: [
      "Je construis ce portfolio — et j'écris sur la rencontre entre la pensée systèmes et le soin de l'interface.",
      "J'approfondis la fiabilité des systèmes distribués.",
      "J'explore les limites d'une UI web soignée et accessible.",
    ],
  },
};

export const now: NowContent = nowSchema.parse(raw);

export function getNowFocus(locale: Locale): string[] {
  return now.focus[locale];
}

export function getNowUpdated(): string {
  return now.updated;
}

/** Whole-day difference between `updated` and a reference instant (default now). */
export function daysSinceUpdate(ref: Date = new Date()): number {
  const updatedMs = new Date(`${now.updated}T00:00:00Z`).getTime();
  return Math.floor((ref.getTime() - updatedMs) / 86_400_000);
}

/** True once the page is older than STALE_AFTER_DAYS. */
export function isStale(ref: Date = new Date()): boolean {
  return daysSinceUpdate(ref) > STALE_AFTER_DAYS;
}

/** Localized "2 months ago" / "il y a 2 mois" (the dictionary supplies the prefix). */
export function relativeUpdated(locale: Locale, ref: Date = new Date()): string {
  const days = daysSinceUpdate(ref);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}
