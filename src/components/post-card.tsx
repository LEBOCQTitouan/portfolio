import Link from "next/link";
import type { Post } from "@/lib/posts";
import { TagPill } from "@/components/tag-pill";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="border-b border-border py-6">
      <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </time>
        <span>{post.readingTimeMinutes} min read</span>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">
        <Link href={`/blog/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 text-muted">{post.summary}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
