"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n/use-t";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref } from "@/i18n/localized-href";

// The sticky bar condenses (tighter padding, smaller logo, translucent
// backdrop) on scroll. Two thresholds, not one: condense on the way down past
// CONDENSE_AT, expand on the way back up past EXPAND_AT. The gap between them is
// hysteresis and it is load-bearing — without it the bar flickers.
//
// Why: this header is `position: sticky; top: 0` AND the first in-flow element,
// and condensing changes its own height by ~24px (py-6 -> py-3). Near the top,
// where the header is still in normal flow (not yet stuck), resizing it makes
// the browser nudge scrollY to keep content stable. With a single threshold
// that nudge re-crosses the line, flipping the state back — a self-sustaining
// condense/expand loop. The band must stay wider than the height delta so a
// resize-induced nudge can never reach the opposite threshold.
const CONDENSE_AT = 56;
const EXPAND_AT = 8;

export function Nav() {
  const { t, lang } = useT();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll across the hysteresis band, rAF-throttled. Only flips state on
  // a boundary crossing so we don't re-render every pixel; inside the band the
  // current state is held.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled((prev) => {
        const y = window.scrollY;
        if (!prev && y > CONDENSE_AT) return true;
        if (prev && y < EXPAND_AT) return false;
        return prev;
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
