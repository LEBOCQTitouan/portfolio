import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Orb } from "./orb";

const meta = {
  title: "Companion/Orb",
  component: Orb,
  parameters: { layout: "centered" },
  argTypes: {
    mood: { control: "inline-radio", options: ["calm", "warm", "focused"] },
    muted: { control: "boolean" },
  },
  args: { mood: "calm", muted: false },
} satisfies Meta<typeof Orb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Calm: Story = { args: { mood: "calm" } };
export const Warm: Story = { args: { mood: "warm" } };
export const Focused: Story = { args: { mood: "focused" } };
export const Muted: Story = { args: { mood: "calm", muted: true } };

export const AllMoods: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
      <Orb mood="calm" muted={false} />
      <Orb mood="warm" muted={false} />
      <Orb mood="focused" muted={false} />
    </div>
  ),
};
