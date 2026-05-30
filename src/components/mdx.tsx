import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { MDXComponents } from "mdx/types";
import { Pre } from "@/components/pre";

const components: MDXComponents = {
  pre: Pre,
};

export function Mdx({ source }: { source: string }) {
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
                rehypePrettyCode,
                { theme: { dark: "github-dark", light: "github-light" } },
              ],
            ],
          },
        }}
      />
    </div>
  );
}
