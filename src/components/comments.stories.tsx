import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Comments } from "./comments";

const meta = {
  title: "Content/Comments",
  component: Comments,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Giscus-backed comments section. The giscus widget is mocked in " +
          "Storybook (no network call); its theme follows the toolbar via " +
          "next-themes. In the app it renders nothing unless the " +
          "`NEXT_PUBLIC_GISCUS_*` env vars are set.",
      },
    },
  },
} satisfies Meta<typeof Comments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
