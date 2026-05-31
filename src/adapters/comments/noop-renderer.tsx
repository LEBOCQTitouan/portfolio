import type { CommentsRenderer } from "@/core/ports/comments-renderer";

export const NoopRenderer: CommentsRenderer = { Comments: () => null };
