import { site } from "@/lib/site";
import type { Post } from "@/lib/posts";

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: `${site.url}/blog/${post.slug}`,
    author: { "@type": "Person", name: site.author, url: site.url },
  };
}
