import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Companion } from "./companion";

const meta = {
  title: "Companion/Companion (full)",
  component: Companion,
  parameters: {
    layout: "fullscreen",
    // The companion reads the route to choose its narration lines.
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
    docs: {
      description: {
        component:
          "The full scroll-driven companion. In the app it tracks " +
          "`[data-narrate]` sections and travels between them; with no such " +
          "sections here it shows the route's first line. It uses fixed " +
          "positioning, so the orb sits at a percentage of the iframe " +
          "viewport, with a mute toggle bottom-right.",
      },
    },
  },
} satisfies Meta<typeof Companion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};

export const AboutRoute: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/about" } },
  },
};
