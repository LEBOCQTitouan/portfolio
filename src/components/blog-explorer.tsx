"use client";

import { useState } from "react";
import type { PostMeta } from "@/core/domain/post";
import { PostCard } from "@/components/post-card";
import { filterPosts } from "@/core/domain/search";
import { useT } from "@/i18n/use-t";

export function BlogExplorer({
  posts,
  allTags,
}: {
  posts: PostMeta[];
  allTags: string[];
}) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = filterPosts(posts, query, selected);

  function toggle(tag: string) {
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.blog.searchPlaceholder}
        aria-label={t.blog.searchLabel}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-0.5 text-xs transition ${
                  active
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <p className="text-muted">{t.blog.noMatch}</p>
        ) : (
          <>
            {filtered.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
