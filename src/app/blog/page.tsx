import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays and notes on software, systems, and design craft.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
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
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </section>
  );
}
