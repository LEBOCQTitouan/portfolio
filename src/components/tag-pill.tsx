import Link from "next/link";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";

export function TagPill({ tag, lang }: { tag: string; lang: Locale }) {
  return (
    <Link
      href={localizedHref(lang, `/blog/tags/${encodeURIComponent(tag)}`)}
      className="rounded-full border border-accent/20 bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-accent transition-colors hover:border-accent/40"
    >
      {tag}
    </Link>
  );
}
