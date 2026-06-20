import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricStrip } from "./metric-strip";

const meta = {
  title: "CaseStudy/MetricStrip",
  component: MetricStrip,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: {
    metrics: [
      { value: "12ms", label: "p99 write latency" },
      { value: "10k/s", label: "sustained throughput" },
      { value: "0", label: "double-counts in prod" },
    ],
  },
} satisfies Meta<typeof MetricStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { metrics: [] } };
