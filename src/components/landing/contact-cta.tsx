import { site } from "@/core/domain/site";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function ContactCta({ t }: { t: Dictionary["contact"] }) {
  return (
    <section
      data-narrate="contact"
      className="my-8 rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {t.body}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="mailto:lebocq.titouan@gmail.com"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          {t.getInTouch}
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
        >
          {t.github}
        </a>
      </div>
    </section>
  );
}
