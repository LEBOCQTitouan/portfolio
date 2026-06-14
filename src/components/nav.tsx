"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n/use-t";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref } from "@/i18n/localized-href";

export function Nav() {
  const { t, lang } = useT();

  const LINKS = [
    { href: localizedHref(lang, "/work"), label: t.nav.work },
    { href: localizedHref(lang, "/blog"), label: t.nav.writing },
    { href: localizedHref(lang, "/about"), label: t.nav.about },
  ];

  return (
    <header className="flex items-center justify-between py-6">
      <Link
        href={localizedHref(lang, "/")}
        className="flex items-center gap-2 text-sm font-bold tracking-tight transition-colors hover:text-accent"
      >
        <Logo className="h-6 w-6" />
        <span className="font-display">Titouan Lebocq</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-muted">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>
    </header>
  );
}
