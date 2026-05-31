import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PillarCard } from "./pillar-card";

const meta = {
  title: "Landing/PillarCard",
  component: PillarCard,
  parameters: { layout: "centered" },
  args: {
    label: "Systems",
    description: "Robust backends, data models, and infrastructure.",
    href: "/work",
  },
} satisfies Meta<typeof PillarCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Grid: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", maxWidth: 520 }}>
      <PillarCard label="Systems" description="Robust backends and infrastructure." href="/work" />
      <PillarCard label="Interface" description="Interfaces people love to use." href="/work" />
      <PillarCard label="Writing" description="Essays on software and design craft." href="/blog" />
      <PillarCard label="About" description="Who I am and how I work." href="/about" />
    </div>
  ),
};
