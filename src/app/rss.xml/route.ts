import { Feed } from "feed";
import { getAllPosts } from "@/composition/server";
import { site } from "@/core/domain/site";

export const dynamic = "force-static";

export function GET() {
  const feed = new Feed({
    title: site.title,
    description: site.description,
    id: site.url,
    link: site.url,
    language: "en",
    copyright: `© ${new Date().getFullYear()} ${site.author}`,
    feedLinks: { rss: `${site.url}/rss.xml` },
    author: { name: site.author, link: site.url },
  });

  for (const post of getAllPosts()) {
    const url = `${site.url}/blog/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.summary,
      date: new Date(post.date),
    });
  }

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
