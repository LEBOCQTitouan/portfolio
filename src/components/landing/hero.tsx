import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries/en";

// Aura hero: the orb (rendered by <Companion/>) sits behind this headline as a
// large ambient aura, then shrinks into the traveling companion on scroll.
// `data-orb-home` marks this section as the orb's hero home (scroll-distance ref).
export function Hero({ t }: { t: Dictionary["hero"] }) {
  return (
    <section data-orb-home className="relative isolate py-20 sm:py-28">
      <div className="relative z-10" data-narrate="hero">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
          {t.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          {t.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/work"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
          >
            {t.viewWork}
          </Link>
          <Link
            href="/blog"
            className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
          >
            {t.readWriting}
          </Link>
        </div>
      </div>
    </section>
  );
}
