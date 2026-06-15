import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TagPill } from "./tag-pill";

const meta = {
  title: "Content/TagPill",
  component: TagPill,
  parameters: { layout: "centered" },
  args: { tag: "typescript" },
} satisfies Meta<typeof TagPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Row: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {["typescript", "next.js", "design", "cloudflare"].map((t) => (
        <TagPill key={t} tag={t} />
      ))}
    </div>
  ),
};
