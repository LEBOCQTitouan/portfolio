import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags, getAllProjects } from "@/composition/server";
import { site } from "@/core/domain/site";
import { locales } from "@/core/domain/locale";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/blog", "/work", "/about", "/uses"];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.flatMap((p) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${p}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${p}`])) as Record<string, string>,
      },
    })),
  );

  // Posts: one entry per locale per slug
  const allPostSlugs = new Set(getAllPosts("en").map((post) => post.slug));
  const postRoutes: MetadataRoute.Sitemap = [...allPostSlugs].flatMap((slug) => {
    const p = `/blog/${slug}`;
    return locales.map((locale) => ({
      url: `${site.url}/${locale}${p}`,
      lastModified: new Date(getAllPosts(locale).find((post) => post.slug === slug)?.date ?? new Date()),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${p}`])) as Record<string, string>,
      },
    }));
  });

  // Tags: iterate per locale (EN is the canonical slug set)
  const allTagSlugs = new Set(getAllTags("en"));
  const tagRoutes: MetadataRoute.Sitemap = [...allTagSlugs].flatMap((tag) => {
    const p = `/blog/tags/${tag}`;
    return locales.map((locale) => ({
      url: `${site.url}/${locale}${p}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${p}`])) as Record<string, string>,
      },
    }));
  });

  // Projects: one entry per locale per slug
  const allProjectSlugs = new Set(getAllProjects("en").map((project) => project.slug));
  const projectRoutes: MetadataRoute.Sitemap = [...allProjectSlugs].flatMap((slug) => {
    const p = `/work/${slug}`;
    return locales.map((locale) => ({
      url: `${site.url}/${locale}${p}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${p}`])) as Record<string, string>,
      },
    }));
  });

  return [...staticRoutes, ...postRoutes, ...tagRoutes, ...projectRoutes];
}
