import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { MDXComponents } from "mdx/types";
import { Pre } from "@/components/pre";

const components: MDXComponents = {
  pre: Pre,
};

// Fine-grained Shiki highlighter: only the languages/themes we actually use, so
// the worker bundle stays small (the full `shiki` bundle ships 250+ grammars).
// The JS regex engine avoids pulling in the Oniguruma WASM binary.
let highlighter: ReturnType<typeof createHighlighterCore> | undefined;
function getHighlighter() {
  highlighter ??= createHighlighterCore({
    langs: [import("@shikijs/langs/typescript").then((m) => m.default)],
    themes: [
      import("@shikijs/themes/github-light").then((m) => m.default),
      import("@shikijs/themes/github-dark").then((m) => m.default),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export async function Mdx({ source }: { source: string }) {
  const hl = await getHighlighter();
  return (
    <div className="prose-content">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeShikiFromHighlighter,
                hl,
                {
                  themes: { light: "github-light", dark: "github-dark" },
                  defaultColor: false,
                },
              ],
            ],
          },
        }}
      />
    </div>
  );
}
