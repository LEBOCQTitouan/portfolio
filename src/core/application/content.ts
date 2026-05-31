import type { ContentRepository } from "@/core/ports/content-repository";
import {
  filterDrafts, sortPostsByDateDesc, toPostMeta, uniqueSortedTags,
  type Post, type PostMeta,
} from "@/core/domain/post";
import { sortProjects, type Project } from "@/core/domain/project";

export function makeContentUseCases(
  repo: ContentRepository,
  options: { includeDrafts: boolean },
) {
  const visiblePosts = (): Post[] =>
    sortPostsByDateDesc(filterDrafts(repo.listPosts(), options.includeDrafts));
  const sortedProjects = (): Project[] => sortProjects(repo.listProjects());

  return {
    listPosts: (): Post[] => visiblePosts(),
    getPost: (slug: string): Post | undefined => visiblePosts().find((p) => p.slug === slug),
    listPostMeta: (): PostMeta[] => visiblePosts().map(toPostMeta),
    listTags: (): string[] => uniqueSortedTags(visiblePosts()),
    postsByTag: (tag: string): Post[] => visiblePosts().filter((p) => p.tags.includes(tag)),
    listProjects: (): Project[] => sortedProjects(),
    getProject: (slug: string): Project | undefined => sortedProjects().find((p) => p.slug === slug),
    featuredProjects: (): Project[] => sortedProjects().filter((p) => p.featured),
  };
}
