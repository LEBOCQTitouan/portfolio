const SOCIALS = [
  { href: "https://github.com/titouanlebocq", label: "GitHub" },
  { href: "https://www.linkedin.com/in/titouanlebocq", label: "LinkedIn" },
];

export function Footer({ year }: { year: number }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>© {year} Titouan Lebocq</span>
      <nav className="flex gap-4">
        <a href="/uses" className="transition-colors hover:text-foreground">
          Uses
        </a>
        <a href="/now" className="transition-colors hover:text-foreground">
          Now
        </a>
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
