"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n/use-t";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Nav() {
  const { t } = useT();

  const LINKS = [
    { href: "/work", label: t.nav.work },
    { href: "/blog", label: t.nav.writing },
    { href: "/about", label: t.nav.about },
  ];

  return (
    <header className="flex items-center justify-between py-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-bold tracking-tight transition-colors hover:text-accent"
      >
        <Logo className="h-6 w-6" />
        Titouan Lebocq
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
