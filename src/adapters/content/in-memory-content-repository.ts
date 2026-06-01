import type { ContentRepository } from "@/core/ports/content-repository";
import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";
import type { Locale } from "@/i18n/config";

type Data = Partial<Record<Locale, { posts?: Post[]; projects?: Project[] }>>;

export class InMemoryContentRepository implements ContentRepository {
  constructor(private readonly data: Data = {}) {}
  listPosts(locale: Locale): Post[] { return this.data[locale]?.posts ?? []; }
  listProjects(locale: Locale): Project[] { return this.data[locale]?.projects ?? []; }
}
