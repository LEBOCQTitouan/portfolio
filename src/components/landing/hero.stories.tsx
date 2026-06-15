import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hero } from "./hero";
import { en } from "@/i18n/dictionaries/en";

const meta = {
  title: "Landing/Hero",
  component: Hero,
  args: { t: en.hero, lang: "en" },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
