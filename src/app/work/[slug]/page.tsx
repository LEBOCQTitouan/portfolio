import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { Mdx } from "@/components/mdx";
import { CategoryBadge } from "@/components/category-badge";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  const url = `${site.url}/work/${project.slug}`;
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: project.title,
      description: project.summary,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="py-8">
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
                Source →
              </a>
            )}
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Live demo →
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
