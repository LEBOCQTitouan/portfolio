import type { ContentRepository } from "@/core/ports/content-repository";
import {
  filterDrafts, sortPostsByDateDesc, toPostMeta, uniqueSortedTags,
  type Post, type PostMeta,
} from "@/core/domain/post";
import { sortProjects, type Project } from "@/core/domain/project";
import type { Locale } from "@/i18n/config";

export function makeContentUseCases(
  repo: ContentRepository,
  options: { includeDrafts: boolean },
) {
  const visiblePosts = (locale: Locale): Post[] =>
    sortPostsByDateDesc(filterDrafts(repo.listPosts(locale), options.includeDrafts));
  const sortedProjects = (locale: Locale): Project[] => sortProjects(repo.listProjects(locale));

  return {
    listPosts: (locale: Locale): Post[] => visiblePosts(locale),
    getPost: (locale: Locale, slug: string): Post | undefined => visiblePosts(locale).find((p) => p.slug === slug),
    listPostMeta: (locale: Locale): PostMeta[] => visiblePosts(locale).map(toPostMeta),
    listTags: (locale: Locale): string[] => uniqueSortedTags(visiblePosts(locale)),
    postsByTag: (locale: Locale, tag: string): Post[] => visiblePosts(locale).filter((p) => p.tags.includes(tag)),
    listProjects: (locale: Locale): Project[] => sortedProjects(locale),
    getProject: (locale: Locale, slug: string): Project | undefined => sortedProjects(locale).find((p) => p.slug === slug),
    featuredProjects: (locale: Locale): Project[] => sortedProjects(locale).filter((p) => p.featured),
  };
}
