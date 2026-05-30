import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
];

export function Nav() {
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
        <ThemeToggle />
      </nav>
    </header>
  );
}
