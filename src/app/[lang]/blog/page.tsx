import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostMeta, getAllTags } from "@/composition/server";
import { BlogExplorer } from "@/components/blog-explorer";
import { Newsletter } from "@/components/newsletter";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays and notes on software, systems, and design craft.",
};

export default async function BlogIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const posts = getAllPostMeta();
  const tags = getAllTags();
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">{dict.blog.title}</h1>
      <p className="mt-2 text-muted">{dict.blog.description}</p>
      <div className="mt-8">
        {posts.length === 0 ? (
          <p className="text-muted">{dict.blog.empty}</p>
        ) : (
          <BlogExplorer posts={posts} allTags={tags} />
        )}
      </div>
      <div className="mt-12">
        <Newsletter />
      </div>
    </section>
  );
}
