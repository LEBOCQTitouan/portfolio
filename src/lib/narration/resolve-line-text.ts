/** The per-project override (from `data-narrate-text`) wins when present and
 *  non-blank; otherwise the generic script line is used. */
export function resolveLineText(datasetText: string | undefined, fallback: string): string {
  return datasetText && datasetText.trim().length > 0 ? datasetText : fallback;
}
