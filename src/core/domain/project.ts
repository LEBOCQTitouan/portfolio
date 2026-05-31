import { z } from "zod";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  stack: z.array(z.string()).default([]),
  category: z.enum(["systems", "interface", "both"]),
  links: z.object({ repo: z.string().optional(), demo: z.string().optional() }).default({}),
  cover: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export type ProjectCategory = "systems" | "interface" | "both";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  stack: string[];
  category: ProjectCategory;
  links: { repo?: string; demo?: string };
  cover?: string;
  featured: boolean;
  order: number;
  content: string;
};

export function parseProject(data: unknown, content: string, slug: string): Project {
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in project "${slug}": ${parsed.error.message}`);
  }
  return { slug, ...parsed.data, content };
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) =>
    a.featured !== b.featured
      ? a.featured ? -1 : 1
      : a.order !== b.order
        ? a.order - b.order
        : a.title.localeCompare(b.title),
  );
}
