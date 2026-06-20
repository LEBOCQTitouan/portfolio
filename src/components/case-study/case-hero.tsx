import type { Project } from "@/core/domain/project";
import { CategoryBadge } from "@/components/category-badge";
import { MorphTitle } from "@/components/transitions/morph-title";
import { workTitleName } from "@/lib/transitions/names";

export function CaseHero({
  project,
  labels,
}: {
  project: Project;
  labels: { source: string; liveDemo: string };
}) {
  return (
    <header
      className="mb-8 rounded-2xl border border-accent/15 bg-[var(--accent-soft)] p-6"
      data-narrate="project-header"
    >
      <div className="flex items-center gap-3">
        <CategoryBadge category={project.category} />
        <span className="text-sm text-muted">{project.role}</span>
      </div>
      <MorphTitle name={workTitleName(project.slug)}>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{project.title}</h1>
      </MorphTitle>
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
              {labels.source}
            </a>
          )}
          {project.links.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {labels.liveDemo}
            </a>
          )}
        </div>
      )}
    </header>
  );
}
