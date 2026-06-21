import Link from "next/link";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";
import { pillClass, type PillTone } from "@/components/ui/styles";

// Standalone (tag-page header) stays accent; inside a card row pass tone="muted"
// so it rests neutral and blooms via the row's .card-pills hover rule.
export function TagPill({
  tag,
  lang,
  tone = "accent",
}: {
  tag: string;
  lang: Locale;
  tone?: PillTone;
}) {
  return (
    <Link
      href={localizedHref(lang, `/blog/tags/${encodeURIComponent(tag)}`)}
      className={pillClass(tone, { interactive: true })}
    >
      {tag}
    </Link>
  );
}
