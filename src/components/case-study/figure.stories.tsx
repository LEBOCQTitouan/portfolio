import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Figure } from "./figure";

const meta = {
  title: "CaseStudy/Figure",
  component: Figure,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  args: { caption: "Event-sourced write path with periodic snapshots" },
};
