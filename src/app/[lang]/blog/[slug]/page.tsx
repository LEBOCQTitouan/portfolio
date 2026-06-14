import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/composition/server";
import { resolveSubject } from "@/core/domain/subject";
import { Mdx } from "@/components/mdx";
import { comments } from "@/composition/client";
import { TagPill } from "@/components/tag-pill";
import { site } from "@/core/domain/site";
import { articleJsonLd } from "@/core/domain/seo";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";

export function generateStaticParams() {
  return getAllPosts("en").map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const post = getPostBySlug(locale, slug);
  if (!post) return {};
  const routePath = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${site.url}/${locale}${routePath}`,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const post = getPostBySlug(lang, slug);
  if (!post) notFound();

  return (
    <article className="py-8" data-subject={resolveSubject({ tags: post.tags })}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)).replace(/</g, "\\u003c"),
        }}
      />
      <header className="mb-8">
        <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(lang, {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <span>{post.readingTimeMinutes} {dict.common.minRead}</span>
        </div>
        <MorphTitle name={PAGE_TITLE}>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
        </MorphTitle>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagPill key={tag} tag={tag} lang={lang} />
            ))}
          </div>
        )}
      </header>
      <Mdx source={post.content} />
      <comments.Comments />
    </article>
  );
}
