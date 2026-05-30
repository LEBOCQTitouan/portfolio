import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/work", "/about"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
  }));
  const postRoutes = getAllPosts().map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));
  const tagRoutes = getAllTags().map((tag) => ({
    url: `${site.url}/blog/tags/${tag}`,
    lastModified: new Date(),
  }));
  const projectRoutes = getAllProjects().map((project) => ({
    url: `${site.url}/work/${project.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...projectRoutes];
}
