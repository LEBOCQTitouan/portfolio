import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { getNowFocus, relativeUpdated } from "@/core/domain/now";

// Refresh the "N months ago" string daily so it tracks real time even when
// statically generated. The cron in .github/workflows/now-freshness.yml is the
// real freshness guard. Verify this segment-config key in node_modules/next/dist/docs/.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/now";

  return {
    title: dict.now.title,
    description: dict.now.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.now.title,
      description: dict.now.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function NowPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const focus = getNowFocus(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.now.title}</h1>
      </MorphTitle>
      <p className="mt-2 text-sm text-muted">
        {dict.now.updatedPrefix} {relativeUpdated(lang)}
      </p>
      <p className="mt-6 max-w-2xl text-muted" data-narrate="intro">
        {dict.now.focusedOn}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" data-narrate="focus">
        {focus.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        This is a{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          {dict.now.nowPageLabel}
        </a>
        .
      </p>
    </section>
  );
}
