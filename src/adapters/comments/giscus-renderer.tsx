"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import type { CommentsRenderer } from "@/core/ports/comments-renderer";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

function GiscusComments() {
  const { resolvedTheme } = useTheme();

  if (!repo || !repoId || !categoryId) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category ?? ""}
        categoryId={categoryId}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        lang="en"
        loading="lazy"
      />
    </section>
  );
}

export const GiscusRenderer: CommentsRenderer = { Comments: GiscusComments };
