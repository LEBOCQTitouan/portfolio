import Link from "next/link";
import type { Project } from "@/core/domain/project";
import { CategoryBadge } from "@/components/category-badge";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";
import { MorphTitle } from "@/components/transitions/morph-title";
import { workTitleName } from "@/lib/transitions/names";
import { resolveSubject } from "@/core/domain/subject";
import { pillClass } from "@/components/ui/styles";

export function ProjectCard({ project, lang }: { project: Project; lang: Locale }) {
  return (
    <article
      className="card-glow border-b border-border py-6"
      data-glow-row
      data-subject={resolveSubject({ category: project.category })}
    >
      <span className="card-edge-light" aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <MorphTitle name={workTitleName(project.slug)}>
          <h2 className="text-xl font-semibold tracking-tight">
            <Link href={localizedHref(lang, `/work/${project.slug}`)} className="hover:text-accent">
              {project.title}
            </Link>
          </h2>
        </MorphTitle>
        <CategoryBadge category={project.category} />
      </div>
      <p className="mt-1 text-sm text-muted">{project.role}</p>
      <p className="mt-2 text-muted">{project.summary}</p>
      {project.stack.length > 0 && (
        <ul className="card-pills mt-3 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li key={tech} className={pillClass("muted")}>
              {tech}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
