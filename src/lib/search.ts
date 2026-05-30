import type { PostMeta } from "@/lib/posts";

export function filterPosts(
  posts: PostMeta[],
  query: string,
  selectedTags: string[],
): PostMeta[] {
  const q = query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesQuery =
      q === "" ||
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => post.tags.includes(tag));
    return matchesQuery && matchesTags;
  });
}
