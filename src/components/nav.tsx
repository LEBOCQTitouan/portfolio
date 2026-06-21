"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n/use-t";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref } from "@/i18n/localized-href";
import { cn } from "@/components/ui/styles";

// Past this scroll offset the sticky bar condenses (tighter padding, smaller
// logo, translucent backdrop). Small so the tightening reads as soon as you move.
const CONDENSE_AT = 8;

export function Nav() {
  const { t, lang } = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll past the threshold, rAF-throttled. Only flips state on a
  // boundary crossing so we don't re-render every pixel.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled((prev) => {
        const next = window.scrollY > CONDENSE_AT;
        return prev === next ? prev : next;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const LINKS = [
    { href: localizedHref(lang, "/work"), label: t.nav.work },
    { href: localizedHref(lang, "/blog"), label: t.nav.writing },
    { href: localizedHref(lang, "/about"), label: t.nav.about },
  ];

  return (
    <header
      data-condensed={scrolled ? "true" : undefined}
      className={[
        // Full column-width sticky bar (-mx-6/px-6 reclaims the column's gutter
        // so the translucent backdrop spans edge to edge).
        "sticky top-0 z-30 -mx-6 flex items-center justify-between px-6 backdrop-blur-md",
        "transition-[padding,background-color,border-color] duration-300 ease-out motion-reduce:transition-none",
        scrolled
          ? "border-b border-border/50 bg-background/75 py-3"
          : "border-b border-transparent bg-transparent py-6",
      ].join(" ")}
    >
      <Link
        href={localizedHref(lang, "/")}
        className="flex items-center gap-2 text-sm font-bold tracking-tight transition-colors hover:text-accent"
      >
        <Logo
          className={`transition-all duration-300 motion-reduce:transition-none ${scrolled ? "h-5 w-5" : "h-6 w-6"}`}
        />
        <span className="font-display">Titouan Lebocq</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-muted">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "link-underline py-1 transition-colors hover:text-foreground",
                active && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <LanguageSwitcher />
        <ThemeToggle />
      </nav>
    </header>
  );
}
