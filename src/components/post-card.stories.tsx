import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { PostMeta } from "@/core/domain/post";
import { PostCard } from "./post-card";

const sample: PostMeta = {
  slug: "engineering-with-craft",
  title: "Engineering with the craft of design",
  date: "2026-04-12",
  summary:
    "Why the best backend engineers think like designers — and how that changes the systems you build.",
  tags: ["design", "systems", "craft"],
  draft: false,
  readingTimeMinutes: 7,
};

const meta = {
  title: "Content/PostCard",
  component: PostCard,
  args: { post: sample },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoTags: Story = {
  args: { post: { ...sample, tags: [] } },
};
