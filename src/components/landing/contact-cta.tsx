import { site } from "@/core/domain/site";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { buttonClass, panelClass } from "@/components/ui/styles";

export function ContactCta({ t }: { t: Dictionary["contact"] }) {
  return (
    <section
      data-narrate="contact"
      className={panelClass({ padding: "px-6 py-12", extra: "my-8 text-center" })}
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {t.body}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a href="mailto:lebocq.titouan@gmail.com" className={buttonClass("primary")} data-bp-attract data-subject="brand">
          {t.getInTouch}
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          className={buttonClass("secondary")}
        >
          {t.github}
        </a>
      </div>
    </section>
  );
}
