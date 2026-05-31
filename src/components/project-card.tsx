import Link from "next/link";
import type { Project } from "@/core/domain/project";
import { CategoryBadge } from "@/components/category-badge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="border-b border-border py-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          <Link href={`/work/${project.slug}`} className="hover:text-accent">
            {project.title}
          </Link>
        </h2>
        <CategoryBadge category={project.category} />
      </div>
      <p className="mt-1 text-sm text-muted">{project.role}</p>
      <p className="mt-2 text-muted">{project.summary}</p>
      {project.stack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
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
    </article>
  );
}
