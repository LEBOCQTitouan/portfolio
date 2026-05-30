import Link from "next/link";

// Landing v0 hero — intentionally self-contained and swappable.
// A later Awwwards-level redesign should be able to replace this file wholesale.
export function Hero() {
  return (
    <section className="py-16 sm:py-24">
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
    </section>
  );
}
