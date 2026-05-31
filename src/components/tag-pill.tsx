import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/localized-href";

export function TagPill({ tag, lang }: { tag: string; lang: Locale }) {
  return (
    <Link
      href={localizedHref(lang, `/blog/tags/${encodeURIComponent(tag)}`)}
      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
    >
      {tag}
    </Link>
  );
}
