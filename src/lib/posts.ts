import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  readingTimeMinutes: number;
  content: string;
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parsePost(raw: string, slug: string): Post {
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in post "${slug}": ${parsed.error.message}`,
    );
  }
  const fm = parsed.data;
  return {
    slug,
    title: fm.title,
    date: toISODate(fm.date),
    summary: fm.summary,
    tags: fm.tags,
    cover: fm.cover,
    draft: fm.draft,
    readingTimeMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    content,
  };
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8");
      return parsePost(raw, slugFromFilename(f));
    })
    .filter((p) => process.env.NODE_ENV === "development" || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) post.tags.forEach((t) => tags.add(t));
  return [...tags].sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
