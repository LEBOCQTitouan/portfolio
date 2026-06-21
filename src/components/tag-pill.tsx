import Link from "next/link";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";
import { pillClass } from "@/components/ui/styles";

export function TagPill({ tag, lang }: { tag: string; lang: Locale }) {
  return (
    <Link
      href={localizedHref(lang, `/blog/tags/${encodeURIComponent(tag)}`)}
      className={pillClass("accent", { interactive: true })}
    >
      {tag}
    </Link>
  );
}
