"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/core/domain/locale";
import { useT } from "@/i18n/use-t";

export function swapLocaleInPath(pathname: string, target: Locale): string {
  const seg = pathname.split("/");
  if (locales.includes(seg[1] as Locale)) {
    seg[1] = target;
    return seg.join("/") || "/";
  }
  return `/${target}${pathname === "/" ? "" : pathname}`;
}

export function LanguageSwitcher() {
  const { lang } = useT();
  const pathname = usePathname();

  return (
    <nav aria-label="Language" className="flex items-center gap-1 text-sm text-muted">
      {(["fr", "en"] as Locale[]).map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">·</span>}
          <Link
            href={swapLocaleInPath(pathname, locale)}
            hrefLang={locale}
            aria-current={lang === locale ? "true" : undefined}
            className={
              lang === locale
                ? "font-semibold text-foreground"
                : "transition-colors hover:text-foreground"
            }
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
            }}
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  );
}
