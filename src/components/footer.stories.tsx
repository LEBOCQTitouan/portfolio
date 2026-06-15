import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Footer } from "./footer";
import { en } from "@/i18n/dictionaries/en";

const meta = {
  title: "Layout/Footer",
  component: Footer,
  args: { year: 2026, t: en.footer, lang: "en" },
  argTypes: { year: { control: { type: "number" } } },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
