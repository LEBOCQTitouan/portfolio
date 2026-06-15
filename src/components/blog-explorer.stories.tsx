import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PostMeta } from "@/core/domain/post";
import { BlogExplorer } from "./blog-explorer";

const posts: PostMeta[] = [
  {
    slug: "engineering-with-craft",
    title: "Engineering with the craft of design",
    date: "2026-04-12",
    summary: "Why the best backend engineers think like designers.",
    tags: ["design", "systems"],
    draft: false,
    readingTimeMinutes: 7,
  },
  {
    slug: "edge-first-rendering",
    title: "Edge-first rendering with Cloudflare Workers",
    date: "2026-03-02",
    summary: "Shipping a Next.js app to the edge and what it changes.",
    tags: ["cloudflare", "systems", "performance"],
    draft: false,
    readingTimeMinutes: 11,
  },
  {
    slug: "type-safe-content",
    title: "Type-safe content with Zod and MDX",
    date: "2026-01-20",
    summary: "Validating frontmatter so broken content fails at build time.",
    tags: ["typescript", "content"],
    draft: false,
    readingTimeMinutes: 5,
  },
];

const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort();

const meta = {
  title: "Content/BlogExplorer",
  component: BlogExplorer,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Client-side search + tag filter over the post list. Type in the " +
          "search box or toggle tags to filter.",
      },
    },
  },
  args: { posts, allTags },
} satisfies Meta<typeof BlogExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPosts: Story = {
  args: { posts: [], allTags: [] },
};
