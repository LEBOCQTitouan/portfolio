import type { Metadata } from "next";
import { getAllPostMeta, getAllTags } from "@/lib/posts";
import { BlogExplorer } from "@/components/blog-explorer";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays and notes on software, systems, and design craft.",
};

export default function BlogIndexPage() {
  const posts = getAllPostMeta();
  const tags = getAllTags();
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Writing</h1>
      <p className="mt-2 text-muted">
        Essays and notes on software, systems, and design craft.
      </p>
      <div className="mt-8">
        {posts.length === 0 ? (
          <p className="text-muted">No posts yet.</p>
        ) : (
          <BlogExplorer posts={posts} allTags={tags} />
        )}
      </div>
    </section>
  );
}
