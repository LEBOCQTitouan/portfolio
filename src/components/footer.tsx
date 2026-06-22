import Link from "next/link";
import { site } from "@/core/domain/site";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";

export function Footer({ year, t, lang }: { year: number; t: Dictionary["footer"]; lang: Locale }) {
  const SOCIALS = [
    { href: site.social.github, label: t.github },
    { href: site.social.linkedin, label: t.linkedin },
  ];

  return (
    <footer className="flex flex-col gap-3 border-t border-border py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between" data-bp-clear>
      <span>© {year} Titouan Lebocq</span>
      <nav className="flex gap-4">
        <Link href={localizedHref(lang, "/uses")} className="link-underline transition-colors hover:text-foreground">
          {t.uses}
        </Link>
        <Link href={localizedHref(lang, "/now")} className="link-underline transition-colors hover:text-foreground">
          {t.now}
        </Link>
        <Link href={localizedHref(lang, "/design-system")} className="link-underline transition-colors hover:text-foreground">
          {t.designSystem}
        </Link>
      </nav>
      <nav className="flex gap-4">
        {SOCIALS.map((social) => (
          <a
            key={social.href}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="link-underline transition-colors hover:text-foreground"
          >
            {social.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
