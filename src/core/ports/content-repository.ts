import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";
import type { Locale } from "@/i18n/config";

/** Returns ALL parsed entities (unsorted, drafts included). Sorting/draft
 *  policy lives in the use-cases so it is testable without a real source. */
export interface ContentRepository {
  listPosts(locale: Locale): Post[];
  listProjects(locale: Locale): Project[];
}
