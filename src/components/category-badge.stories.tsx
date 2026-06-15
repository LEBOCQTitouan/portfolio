import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryBadge } from "./category-badge";

const meta = {
  title: "Content/CategoryBadge",
  component: CategoryBadge,
  parameters: { layout: "centered" },
  argTypes: {
    category: { control: "inline-radio", options: ["systems", "interface", "both"] },
  },
  args: { category: "systems" },
} satisfies Meta<typeof CategoryBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Systems: Story = { args: { category: "systems" } };
export const Interface: Story = { args: { category: "interface" } };
export const Both: Story = { args: { category: "both" } };
