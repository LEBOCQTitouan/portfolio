"use client";
import Link from "next/link";
import { site } from "@/core/domain/site";
import { useT } from "@/i18n/use-t";

export function Footer({ year }: { year: number }) {
  const { t } = useT();

  const SOCIALS = [
    { href: site.social.github, label: t.footer.github },
    { href: site.social.linkedin, label: t.footer.linkedin },
  ];

  return (
    <footer className="flex flex-col gap-3 border-t border-border py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>© {year} Titouan Lebocq</span>
      <nav className="flex gap-4">
        <Link href="/uses" className="transition-colors hover:text-foreground">
          {t.footer.uses}
        </Link>
        <Link href="/now" className="transition-colors hover:text-foreground">
          {t.footer.now}
        </Link>
      </nav>
      <nav className="flex gap-4">
        {SOCIALS.map((social) => (
          <a
            key={social.href}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {social.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
