/** view-transition-name applied to each page's primary heading. One per page;
 *  navigating between pages morphs the heading (position + size + color). */
export const PAGE_TITLE = "page-title";

/** view-transition-name on the .page-aura layer so its color crossfade can be
 *  tuned independently as the deliberate recolor beat. */
export const PAGE_AURA = "page-aura";

/** Per-slug shared name pairing a work card title with its detail hero. Unique
 *  per project so names never collide within a rendered page. */
export function workTitleName(slug: string): string {
  return `work-title-${slug}`;
}
