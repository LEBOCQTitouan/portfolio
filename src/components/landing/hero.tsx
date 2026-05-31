import Link from "next/link";

// Aura hero: the orb (rendered by <Companion/>) sits behind this headline as a
// large ambient aura, then shrinks into the traveling companion on scroll.
// `data-orb-home` marks this section as the orb's hero home (scroll-distance ref).
export function Hero() {
  return (
    <section data-orb-home className="relative isolate py-20 sm:py-28">
      <div className="relative z-10" data-narrate="hero">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Software Engineer · Design-led
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
          Engineering with the craft of design.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          I build robust backend systems and interfaces people love — pushing
          technology to its limits without ever losing clarity.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/work"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
          >
            View work
          </Link>
          <Link
            href="/blog"
            className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
          >
            Read writing
          </Link>
        </div>
      </div>
    </section>
  );
}
