import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  stack: z.array(z.string()).default([]),
  category: z.enum(["systems", "interface", "both"]),
  links: z
    .object({ repo: z.string().optional(), demo: z.string().optional() })
    .default({}),
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

export function parseProject(raw: string, slug: string): Project {
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in project "${slug}": ${parsed.error.message}`,
    );
  }
  return { slug, ...parsed.data, content };
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

export function getAllProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) =>
      parseProject(
        fs.readFileSync(path.join(PROJECTS_DIR, f), "utf8"),
        slugFromFilename(f),
      ),
    )
    .sort((a, b) =>
      a.featured !== b.featured
        ? a.featured
          ? -1
          : 1
        : a.order !== b.order
          ? a.order - b.order
          : a.title.localeCompare(b.title),
    );
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((p) => p.featured);
}
