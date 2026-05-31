import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "./logo";

const meta = {
  title: "Brand/Logo",
  component: Logo,
  parameters: { layout: "centered" },
  args: { className: "h-16 w-16" },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// `currentColor` means it inherits text color — accent here.
export const Accent: Story = { args: { className: "h-16 w-16 text-accent" } };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <Logo className="h-6 w-6" />
      <Logo className="h-10 w-10" />
      <Logo className="h-16 w-16" />
    </div>
  ),
};
