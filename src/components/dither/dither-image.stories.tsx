import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DitherImage } from "@/components/dither/dither-image";

// A reliable, CORS-friendly demo image. If offline, swap for a local /public asset.
const SRC = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=70&fm=jpg";

const meta: Meta<typeof DitherImage> = {
  title: "Effects/DitherImage",
  component: DitherImage,
  args: { src: SRC, alt: "Mountain landscape", pattern: "bayer", levels: 2, cellSize: 2, contrast: 1.25 },
  parameters: { layout: "centered" },
  decorators: [(S) => <div style={{ width: 640 }}><S /></div>],
};
export default meta;
type Story = StoryObj<typeof DitherImage>;

export const Default: Story = {};
export const BlueNoise: Story = { args: { pattern: "blue-noise" } };
export const SixTone: Story = { args: { levels: 6 } };
export const CoarseCells: Story = { args: { cellSize: 5 } };
export const Small: Story = { decorators: [(S) => <div style={{ width: 200 }}><S /></div>] };
export const AccentDuotone: Story = { args: { ink: "var(--accent)" } };
export const Static: Story = { args: { animate: false } };
