import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostMeta, getAllTags } from "@/composition/server";
import { BlogExplorer } from "@/components/blog-explorer";
import { Newsletter } from "@/components/newsletter";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/blog";

  return {
    title: dict.blog.title,
    description: dict.blog.description,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.blog.title,
      description: dict.blog.description,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const posts = getAllPostMeta(lang);
  const tags = getAllTags(lang);
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
