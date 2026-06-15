import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Nav } from "./nav";

const meta = {
  title: "Layout/Nav",
  component: Nav,
} satisfies Meta<typeof Nav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
