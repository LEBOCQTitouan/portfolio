import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClass } from "@/components/ui/styles";

// Aura hero: the orb (rendered by <Companion/>) sits behind this headline as a
// large ambient aura, then shrinks into the traveling companion on scroll.
// `data-orb-home` marks this section as the orb's hero home (scroll-distance ref).
export function Hero({ t, lang }: { t: Dictionary["hero"]; lang: Locale }) {
  return (
    <section data-orb-home className="relative isolate py-20 sm:py-28">
      <div className="relative z-10" data-narrate="hero">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <MorphTitle name={PAGE_TITLE}>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            {t.title}
          </h1>
        </MorphTitle>
        <p className="mt-5 max-w-xl text-lg text-muted">
          {t.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href={localizedHref(lang, "/work")} className={buttonClass("primary")} data-bp-attract data-subject="brand">
            {t.viewWork}
          </Link>
          <Link href={localizedHref(lang, "/blog")} className={buttonClass("secondary")} data-bp-attract data-subject="brand">
            {t.readWriting}
          </Link>
        </div>
      </div>
    </section>
  );
}
