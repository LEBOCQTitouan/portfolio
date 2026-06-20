import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Project } from "@/core/domain/project";
import { ProjectCard } from "./project-card";

const sample: Project = {
  slug: "companion-orb",
  title: "Companion Orb",
  summary:
    "A scroll-driven narration companion that follows the reader and adapts its mood per section.",
  role: "Design & Engineering",
  stack: ["Next.js", "React", "TypeScript", "Tailwind"],
  category: "both",
  links: { repo: "#", demo: "#" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};

const meta = {
  title: "Content/ProjectCard",
  component: ProjectCard,
  args: { project: sample, lang: "en" },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoStack: Story = {
  args: { project: { ...sample, stack: [] } },
};

export const SystemsOnly: Story = {
  args: {
    project: {
      ...sample,
      title: "Edge Cache Layer",
      category: "systems",
      role: "Backend Engineering",
      summary: "A request-coalescing cache that cut p99 latency by 40%.",
      stack: ["Cloudflare Workers", "KV", "TypeScript"],
    },
  },
};
