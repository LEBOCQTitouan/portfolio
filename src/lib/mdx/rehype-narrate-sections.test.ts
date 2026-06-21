import { describe, it, expect } from "vitest";
import { rehypeNarrateSections, type HastNode, type HastRoot } from "./rehype-narrate-sections";

// Minimal hast builders for tests.
const h2 = (text: string): HastNode => ({ type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: text }] });
const p = (text: string): HastNode => ({ type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: text }] });
const root = (...children: HastNode[]): HastRoot => ({ type: "root", children });

const run = (tree: HastRoot, texts?: string[]): HastRoot => {
  rehypeNarrateSections({ texts })(tree);
  return tree;
};
const sections = (tree: HastRoot): HastNode[] => tree.children.filter((n) => n.tagName === "section");
const keyOf = (s: HastNode) => s.properties?.["data-narrate"];

describe("rehypeNarrateSections", () => {
  it("keys 3 sections as section-1, section-2, section-last", () => {
    const tree = run(root(h2("Problem"), p("a"), h2("Approach"), p("b"), h2("Outcome"), p("c")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1", "section-2", "section-last"]);
  });
  it("keys 4 sections as section-1, section-2, section-3, section-last", () => {
    const tree = run(root(h2("S"), h2("D"), h2("T"), h2("O")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1", "section-2", "section-3", "section-last"]);
  });
  it("keys a single section as section-1", () => {
    const tree = run(root(h2("Only"), p("x")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1"]);
  });
  it("leaves a tree with no h2 untouched", () => {
    const tree = run(root(p("just prose"), p("more")));
    expect(sections(tree)).toHaveLength(0);
    expect(tree.children).toHaveLength(2);
  });
  it("groups a section's following siblings as its children", () => {
    const tree = run(root(h2("Problem"), p("a"), p("b"), h2("Outcome"), p("c")));
    const [first] = sections(tree);
    expect((first.children ?? []).map((n: HastNode) => n.tagName)).toEqual(["h2", "p", "p"]);
  });
  it("keeps content before the first h2 outside any section (lead)", () => {
    const tree = run(root(p("intro"), h2("Problem"), p("a")));
    expect(tree.children[0].tagName).toBe("p");
    expect(tree.children[1].tagName).toBe("section");
  });
  it("sets data-narrate-text positionally and skips blank/missing entries", () => {
    const tree = run(
      root(h2("A"), h2("B"), h2("C")),
      ["first line", "   ", undefined as unknown as string],
    );
    const [a, b, c] = sections(tree);
    expect(a.properties?.["data-narrate-text"]).toBe("first line");
    expect(b.properties?.["data-narrate-text"]).toBeUndefined();
    expect(c.properties?.["data-narrate-text"]).toBeUndefined();
  });
  it("ignores extra texts beyond the section count", () => {
    const tree = run(root(h2("A")), ["one", "two", "three"]);
    expect(sections(tree)).toHaveLength(1);
    expect(sections(tree)[0].properties?.["data-narrate-text"]).toBe("one");
  });
  it("preserves arbitrary non-h2 node types verbatim inside their section", () => {
    const widget = { type: "mdxJsxFlowElement", name: "CodePlayground", attributes: [], children: [] };
    const tree = run(root(h2("Approach"), widget));
    const [s] = sections(tree);
    expect((s.children ?? [])[1]).toBe(widget); // moved, not transformed
  });
});
