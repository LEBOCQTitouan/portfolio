import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects } from "@/composition/server";
import { ProjectCard } from "@/components/project-card";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/work";

  return {
    title: dict.work.title,
    description: dict.work.description,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.work.title,
      description: dict.work.description,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const projects = getAllProjects(lang);
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">{dict.work.title}</h1>
      <p className="mt-2 text-muted" data-narrate="intro">
        {dict.work.description}
      </p>
      <div className="mt-8" data-narrate="projects">
        {projects.length === 0 ? (
          <p className="text-muted">{dict.work.empty}</p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))
        )}
      </div>
    </section>
  );
}
