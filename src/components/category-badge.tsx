import type { ProjectCategory } from "@/core/domain/project";

const LABELS: Record<ProjectCategory, string> = {
  systems: "Systems",
  interface: "Interface",
  both: "Systems · Interface",
};

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  return (
    <span className="shrink-0 rounded-full border border-accent/40 px-2 py-0.5 text-xs font-medium text-accent">
      {LABELS[category]}
    </span>
  );
}
