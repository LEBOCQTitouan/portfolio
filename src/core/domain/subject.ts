import type { ProjectCategory } from "./project";
import type { SubjectId } from "@/design/tokens";

export type { SubjectId };

/** Curated tag → subject map. Priority order matters: ai > systems > interface. */
const TAG_GROUPS: { subject: SubjectId; tags: string[] }[] = [
  { subject: "ai", tags: ["ai", "ml", "llm", "machine-learning", "genai", "rag"] },
  { subject: "systems", tags: ["systems", "architecture", "backend", "infra", "distributed", "rust"] },
  { subject: "interface", tags: ["design", "frontend", "ui", "ux", "css", "react"] },
];

const CATEGORY_MAP: Record<ProjectCategory, SubjectId> = {
  systems: "systems",
  interface: "interface",
  both: "brand", // blend deferred (YAGNI)
};

export type SubjectInput = { category?: ProjectCategory; tags?: string[] };

/** Resolve content metadata to a subject id. Category wins; then tags by
 *  priority; otherwise brand. Pure — safe for server or client. */
export function resolveSubject(input: SubjectInput): SubjectId {
  if (input.category) return CATEGORY_MAP[input.category];
  const tags = (input.tags ?? []).map((t) => t.toLowerCase());
  for (const group of TAG_GROUPS) {
    if (tags.some((t) => group.tags.includes(t))) return group.subject;
  }
  return "brand";
}
