import type { ProjectCategory } from "@/core/domain/project";
import { cn, pillClass } from "@/components/ui/styles";

const LABELS: Record<ProjectCategory, string> = {
  systems: "Systems",
  interface: "Interface",
  both: "Systems · Interface",
};

// In list cards (default) the badge rests neutral and blooms to the row's
// subject on hover via the .card-subject rule in globals.css. On a committed
// detail page (`accent`) it shows the subject color at rest.
export function CategoryBadge({
  category,
  accent = false,
}: {
  category: ProjectCategory;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <span className={pillClass("accent", { extra: "shrink-0 font-medium" })}>
        {LABELS[category]}
      </span>
    );
  }
  return (
    <span className={cn(pillClass("muted", { extra: "shrink-0 gap-1.5" }), "card-subject")}>
      <span className="card-dot inline-block h-1.5 w-1.5 rounded-pill bg-muted transition-colors" aria-hidden="true" />
      {LABELS[category]}
    </span>
  );
}
