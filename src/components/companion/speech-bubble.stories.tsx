import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SpeechBubble } from "./speech-bubble";

const meta = {
  title: "Companion/SpeechBubble",
  component: SpeechBubble,
  parameters: { layout: "centered" },
  argTypes: {
    text: { control: "text" },
    reducedMotion: {
      control: "boolean",
      description: "When true, shows the full text immediately (no typewriter).",
    },
  },
  args: {
    text: "Hey — I'm the site companion. I narrate as you scroll.",
    reducedMotion: true,
  },
} satisfies Meta<typeof SpeechBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

// Static so the docs/snapshot is stable.
export const FullText: Story = { args: { reducedMotion: true } };

// Animated character-by-character reveal.
export const Typewriter: Story = { args: { reducedMotion: false } };

export const ShortLine: Story = {
  args: { text: "Welcome.", reducedMotion: true },
};
