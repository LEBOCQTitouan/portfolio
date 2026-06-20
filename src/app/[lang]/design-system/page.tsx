import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { SubjectSwitcher } from "@/components/design-system-showcase/subject-switcher";
import { TokenReference } from "@/components/design-system-showcase/token-reference";
import { CompanionSandbox } from "@/components/design-system-showcase/companion-sandbox";
import { Typography } from "@/components/design-system-showcase/typography";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/design-system";
  return {
    title: dict.designSystem.title,
    description: dict.designSystem.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.designSystem.title,
      description: dict.designSystem.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function DesignSystemPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const ds = dict.designSystem;

  return (
    <article className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{ds.title}</h1>
      </MorphTitle>

      <section className="mt-8 max-w-2xl" data-narrate="problem">
        <h2 className="text-xl font-semibold tracking-tight">{ds.problemTitle}</h2>
        <p className="mt-3 text-muted">{ds.problem1}</p>
        <p className="mt-3 text-muted">{ds.problem2}</p>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{ds.principleTitle}</h2>
        <p className="mt-3 text-muted">{ds.principle1}</p>
        <p className="mt-3 text-muted">{ds.principle2}</p>
      </section>

      <section className="mt-12" data-narrate="subjects">
        <h2 className="text-xl font-semibold tracking-tight">{ds.subjectsTitle}</h2>
        <p className="mt-2 text-muted">{ds.subjectsHint}</p>
        <div className="mt-6"><SubjectSwitcher lead={ds.previewLead} accent={ds.previewAccent} primaryAction={ds.primaryAction} /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{ds.tokensTitle}</h2>
        <p className="mt-2 text-muted">{ds.tokensHint}</p>
        <div className="mt-6"><TokenReference /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{ds.typeTitle}</h2>
        <p className="mt-2 text-muted">{ds.typeHint}</p>
        <div className="mt-6"><Typography displayLabel={ds.typeDisplay} sansLabel={ds.typeSans} /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{ds.companionTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">{ds.companionBody}</p>
        <div className="mt-6"><CompanionSandbox /></div>
      </section>

      <section className="mt-12 max-w-2xl" data-narrate="decisions">
        <h2 className="text-xl font-semibold tracking-tight">{ds.decisionsTitle}</h2>
        <dl className="mt-4 space-y-5">
          {ds.decisions.map((d, i) => (
            <div key={i}>
              <dt className="font-semibold">{d.q}</dt>
              <dd className="mt-1 text-muted">{d.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{ds.outcomeTitle}</h2>
        <p className="mt-3 text-muted">{ds.outcome}</p>
      </section>
    </article>
  );
}
