import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/composition/server";
import { resolveSubject } from "@/core/domain/subject";
import { Mdx } from "@/components/mdx";
import { site } from "@/core/domain/site";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { CaseHero } from "@/components/case-study/case-hero";
import { MetricStrip } from "@/components/case-study/metric-strip";

export function generateStaticParams() {
  return getAllProjects("en").map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const project = getProjectBySlug(locale, slug);
  if (!project) return {};
  const routePath = `/work/${project.slug}`;
  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${site.url}/${locale}${routePath}`,
      title: project.title,
      description: project.summary,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const project = getProjectBySlug(lang, slug);
  if (!project) notFound();

  return (
    <article className="py-8" data-subject={resolveSubject({ category: project.category })}>
      <CaseHero
        project={project}
        labels={{ source: dict.work.source, liveDemo: dict.work.liveDemo }}
        narrateHeader={project.narrate?.header}
      />
      <MetricStrip metrics={project.metrics} />
      <div className="mt-8">
        <Mdx source={project.content} narrateBeats={project.narrate?.beats} />
      </div>
    </article>
  );
}
