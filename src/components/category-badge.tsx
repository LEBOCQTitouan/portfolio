import type { ProjectCategory } from "@/core/domain/project";
import { pillClass } from "@/components/ui/styles";

const LABELS: Record<ProjectCategory, string> = {
  systems: "Systems",
  interface: "Interface",
  both: "Systems · Interface",
};

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  return (
    <span className={pillClass("accent", { extra: "shrink-0 font-medium" })}>
      {LABELS[category]}
    </span>
  );
}
