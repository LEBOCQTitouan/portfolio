import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Dimension, TitleBlock, DraftingMarks } from "./blueprint-frame";

const meta = {
  title: "Blueprint/Frame",
} satisfies Meta;

export default meta;

export const Dimension_: StoryObj = { name: "Dimension", render: () => (
  <div style={{ position: "relative", height: 80 }}><Dimension /></div>
) };

export const TitleBlock_: StoryObj = { name: "TitleBlock", render: () => (
  <div style={{ position: "relative", height: 200 }}><TitleBlock lang="en" /></div>
) };

export const DraftingMarks_: StoryObj = { name: "DraftingMarks", render: () => (
  <div style={{ position: "relative", height: 80 }}><DraftingMarks /></div>
) };
