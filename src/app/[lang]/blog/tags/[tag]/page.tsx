import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/composition/server";
import { PostCard } from "@/components/post-card";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";

export function generateStaticParams() {
  return getAllTags("en").map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; tag: string }>;
}): Promise<Metadata> {
  const { lang, tag } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const routePath = `/blog/tags/${tag}`;
  return {
    title: `#${tag}`,
    description: `Posts tagged "${tag}".`,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ lang: string; tag: string }>;
}) {
  const { lang, tag } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const posts = getPostsByTag(lang, tag);
  if (posts.length === 0) notFound();

  return (
    <section className="py-8">
      <p className="text-sm uppercase tracking-wide text-accent">{dict.blog.tag}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">#{tag}</h1>
      <div className="mt-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
