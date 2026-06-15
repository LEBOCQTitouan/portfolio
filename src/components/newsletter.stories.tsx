import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Newsletter } from "./newsletter";

const meta = {
  title: "Forms/Newsletter",
  component: Newsletter,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Submits to `/api/subscribe`. That endpoint isn't available in " +
          "Storybook, so submitting shows the error state — useful for checking " +
          "the failure styling.",
      },
    },
  },
} satisfies Meta<typeof Newsletter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 420, maxWidth: "100%" }}>
      <Newsletter />
    </div>
  ),
};
