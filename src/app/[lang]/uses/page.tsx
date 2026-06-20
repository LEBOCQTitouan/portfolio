import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { getUses } from "@/core/domain/uses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/uses";

  return {
    title: dict.uses.title,
    description: dict.uses.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.uses.title,
      description: dict.uses.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function UsesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const categories = getUses(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.uses.title}</h1>
      </MorphTitle>
      <p className="mt-2 max-w-2xl text-muted" data-narrate="intro">
        {dict.uses.intro}
      </p>
      <div className="mt-8 space-y-10" data-narrate="tools">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold tracking-tight">{cat.title}</h2>
            <dl className="mt-3 space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="grid gap-x-6 gap-y-0.5 sm:grid-cols-[12rem_1fr]"
                >
                  <dt className="font-medium text-foreground">{item.name}</dt>
                  <dd className="text-muted">{item.why}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
