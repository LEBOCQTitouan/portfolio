import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/composition/server";
import { resolveSubject } from "@/core/domain/subject";
import { Mdx } from "@/components/mdx";
import { CategoryBadge } from "@/components/category-badge";
import { site } from "@/core/domain/site";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

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
      <header className="mb-8" data-narrate="project-header">
        <div className="flex items-center gap-3">
          <CategoryBadge category={project.category} />
          <span className="text-sm text-muted">{project.role}</span>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          {project.title}
        </h1>
        <p className="mt-2 text-muted">{project.summary}</p>
        {project.stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        )}
        {(project.links.repo || project.links.demo) && (
          <div className="mt-4 flex gap-4 text-sm">
            {project.links.repo && (
              <a
                href={project.links.repo}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {dict.work.source}
              </a>
            )}
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {dict.work.liveDemo}
              </a>
            )}
          </div>
        )}
      </header>
      <div data-narrate="project-body">
        <Mdx source={project.content} />
      </div>
    </article>
  );
}
