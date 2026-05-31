import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CopyButton } from "./copy-button";

const meta = {
  title: "Content/CopyButton",
  component: CopyButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Sits inside a `group relative` container (e.g. a code block) and fades " +
          "in on hover. Hover the box below to reveal it.",
      },
    },
  },
  args: { getText: () => "npm run storybook" },
  // The button is absolutely positioned + hidden until the parent `.group` is
  // hovered, so wrap it in a representative code-block container.
  decorators: [
    (Story) => (
      <div className="group relative rounded-md border border-border bg-card p-4 font-mono text-sm">
        <span className="text-muted">$ npm run storybook</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
