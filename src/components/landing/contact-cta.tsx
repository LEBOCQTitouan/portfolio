"use client";
import { site } from "@/core/domain/site";
import { useT } from "@/i18n/use-t";

export function ContactCta() {
  const { t } = useT();

  return (
    <section
      data-narrate="contact"
      className="my-8 rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t.contact.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {t.contact.body}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="mailto:lebocq.titouan@gmail.com"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          {t.contact.getInTouch}
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
        >
          {t.contact.github}
        </a>
      </div>
    </section>
  );
}
