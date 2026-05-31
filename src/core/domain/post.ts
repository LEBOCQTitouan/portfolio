import { z } from "zod";

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

export type PostMeta = Omit<Post, "content">;

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse raw MDX (frontmatter + body) into a Post. `readingTimeMinutes` is
 *  computed by the adapter (the reading-time lib is fs-adjacent) and injected. */
export function parsePost(
  data: unknown,
  content: string,
  slug: string,
  readingTimeMinutes: number,
): Post {
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in post "${slug}": ${parsed.error.message}`);
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
    readingTimeMinutes,
    content,
  };
}

export function sortPostsByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function filterDrafts(posts: Post[], includeDrafts: boolean): Post[] {
  return includeDrafts ? posts : posts.filter((p) => !p.draft);
}

export function toPostMeta(post: Post): PostMeta {
  const { content, ...meta } = post;
  return meta;
}

export function uniqueSortedTags(posts: { tags: string[] }[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) post.tags.forEach((t) => tags.add(t));
  return [...tags].sort();
}
