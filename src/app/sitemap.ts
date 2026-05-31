import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags, getAllProjects } from "@/composition/server";
import { site } from "@/core/domain/site";
import { defaultLocale } from "@/i18n/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/work", "/about", "/uses", "/now"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
  }));
  // i18n: iterate locales in Task 7
  const postRoutes = getAllPosts(defaultLocale).map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));
  const tagRoutes = getAllTags(defaultLocale).map((tag) => ({
    url: `${site.url}/blog/tags/${tag}`,
    lastModified: new Date(),
  }));
  const projectRoutes = getAllProjects(defaultLocale).map((project) => ({
    url: `${site.url}/work/${project.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...projectRoutes];
}
