// Local minimal hast types — @types/hast is not installed; we only touch a few
// fields, so a structural subset keeps the plugin typed without a new dependency.
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  [key: string]: unknown;
};
type HastRoot = { type: "root"; children: HastNode[] };

/**
 * Groups each top-level `<h2>` and its following siblings into a
 * `<section data-narrate="...">` so the companion orb can narrate per section.
 * Keys: first → "section-1", last → "section-last", middles → "section-{i+1}".
 * `options.texts[i]` (non-blank) becomes that section's `data-narrate-text`.
 */
export function rehypeNarrateSections(options: { texts?: string[] } = {}) {
  const texts = options.texts ?? [];
  return (tree: HastRoot): void => {
    const lead: HastNode[] = [];
    const groups: HastNode[][] = [];
    let current: HastNode[] | null = null;

    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        current = [node];
        groups.push(current);
      } else if (current) {
        current.push(node);
      } else {
        lead.push(node);
      }
    }
    if (groups.length === 0) return;

    const n = groups.length;
    const sections: HastNode[] = groups.map((children, i) => {
      const key = i === 0 ? "section-1" : i === n - 1 ? "section-last" : `section-${i + 1}`;
      const properties: Record<string, string> = { "data-narrate": key };
      const text = texts[i];
      if (typeof text === "string" && text.trim().length > 0) {
        properties["data-narrate-text"] = text;
      }
      return { type: "element", tagName: "section", properties, children };
    });

    tree.children = [...lead, ...sections];
  };
}
