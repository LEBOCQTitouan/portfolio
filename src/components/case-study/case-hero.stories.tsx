import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Project } from "@/core/domain/project";
import { CaseHero } from "./case-hero";

const project: Project = {
  slug: "ledger-engine",
  title: "Ledger Engine",
  summary: "A distributed double-entry ledger that stays correct and fast under load.",
  role: "Lead backend engineer",
  stack: ["Go", "Postgres", "Kafka", "gRPC"],
  category: "systems",
  links: { repo: "#", demo: "#" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};

const meta = {
  title: "CaseStudy/CaseHero",
  component: CaseHero,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: { project, labels: { source: "Source", liveDemo: "Live demo" } },
} satisfies Meta<typeof CaseHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
