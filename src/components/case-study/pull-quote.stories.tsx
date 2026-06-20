import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullQuote } from "./pull-quote";

const meta = {
  title: "CaseStudy/PullQuote",
  component: PullQuote,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: { children: "The hard part wasn't scale — it was staying correct under it." },
} satisfies Meta<typeof PullQuote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithCitation: Story = { args: { cite: "Lead backend engineer" } };
