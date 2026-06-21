import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CaseHero } from "@/components/case-study/case-hero";
import type { Project } from "@/core/domain/project";

const project: Project = {
  slug: "ledger-engine",
  title: "Ledger Engine",
  summary: "A distributed double-entry ledger.",
  role: "Lead backend engineer",
  stack: ["Go", "Postgres"],
  category: "systems",
  links: { repo: "https://github.com/example/ledger", demo: "https://demo.example.com" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};
const labels = { source: "Source", liveDemo: "Live demo" };

describe("CaseHero", () => {
  it("renders title, role, summary, stack, and links", () => {
    render(<CaseHero project={project} labels={labels} />);
    expect(screen.getByRole("heading", { name: /ledger engine/i })).toBeInTheDocument();
    expect(screen.getByText(/lead backend engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/distributed double-entry/i)).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /source/i })).toHaveAttribute(
      "href",
      "https://github.com/example/ledger",
    );
    expect(screen.getByRole("link", { name: /live demo/i })).toHaveAttribute(
      "href",
      "https://demo.example.com",
    );
  });

  it("exposes the narration hook", () => {
    const { container } = render(<CaseHero project={project} labels={labels} />);
    expect(container.querySelector('[data-narrate="project-header"]')).not.toBeNull();
  });

  it("sets data-narrate-text on the header when narrateHeader is provided", () => {
    const { container } = render(
      <CaseHero project={project} labels={labels} narrateHeader="Ledger Engine. Never lie about money." />,
    );
    expect(container.querySelector('[data-narrate="project-header"]'))
      .toHaveAttribute("data-narrate-text", "Ledger Engine. Never lie about money.");
  });
  it("omits data-narrate-text when narrateHeader is absent", () => {
    const { container } = render(<CaseHero project={project} labels={labels} />);
    expect(container.querySelector('[data-narrate="project-header"]'))
      .not.toHaveAttribute("data-narrate-text");
  });
});
