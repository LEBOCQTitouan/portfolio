"use client";
import Link from "next/link";
import type { PostMeta } from "@/core/domain/post";
import { TagPill } from "@/components/tag-pill";
import { useT } from "@/i18n/use-t";
import { localizedHref } from "@/i18n/localized-href";

export function PostCard({ post }: { post: PostMeta }) {
  const { t, lang } = useT();

  return (
    <article className="border-b border-border py-6">
      <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString(lang, {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}
        </time>
        <span>{post.readingTimeMinutes} {t.common.minRead}</span>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">
        <Link href={localizedHref(lang, `/blog/${post.slug}`)} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 text-muted">{post.summary}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} lang={lang} />
          ))}
        </div>
      )}
    </article>
  );
}
