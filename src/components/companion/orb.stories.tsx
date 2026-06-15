import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Orb } from "./orb";

const meta = {
  title: "Companion/Orb",
  component: Orb,
  parameters: { layout: "centered" },
  argTypes: {
    mood: { control: "inline-radio", options: ["calm", "warm", "focused"] },
    reaction: {
      control: "inline-radio",
      options: ["active", "sleepy", "asleep", "annoyed", "angry"],
    },
  },
  args: { mood: "calm", reaction: "active", gaze: { x: 0, y: 0 } },
} satisfies Meta<typeof Orb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Calm: Story = { args: { mood: "calm" } };
export const Warm: Story = { args: { mood: "warm" } };
export const Focused: Story = { args: { mood: "focused" } };
export const Sleepy: Story = { args: { mood: "calm", reaction: "sleepy" } };

export const AllMoods: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
      <Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} />
      <Orb mood="warm" reaction="active" gaze={{ x: 0, y: 0 }} />
      <Orb mood="focused" reaction="active" gaze={{ x: 0, y: 0 }} />
    </div>
  ),
};
