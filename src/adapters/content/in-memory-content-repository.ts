import type { ContentRepository } from "@/core/ports/content-repository";
import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";

export class InMemoryContentRepository implements ContentRepository {
  constructor(private readonly data: { posts?: Post[]; projects?: Project[] } = {}) {}
  listPosts(): Post[] { return this.data.posts ?? []; }
  listProjects(): Project[] { return this.data.projects ?? []; }
}
