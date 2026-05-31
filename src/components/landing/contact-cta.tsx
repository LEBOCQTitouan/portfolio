import { site } from "@/core/domain/site";

export function ContactCta() {
  return (
    <section
      data-narrate="contact"
      className="my-8 rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Let&apos;s build something.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        I&apos;m open to roles and collaborations. The fastest way to reach me is
        email.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="mailto:lebocq.titouan@gmail.com"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          Get in touch
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
