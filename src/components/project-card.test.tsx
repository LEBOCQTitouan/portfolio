import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/core/domain/project";

const project: Project = {
  slug: "ledger-engine",
  title: "Ledger Engine",
  summary: "A distributed double-entry ledger.",
  role: "Lead backend engineer",
  stack: ["Go", "Postgres"],
  category: "systems",
  links: { repo: "https://github.com/example/ledger" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};

describe("ProjectCard", () => {
  it("links to the project detail page", () => {
    render(<ProjectCard project={project} lang="en" />);
    expect(
      screen.getByRole("link", { name: /ledger engine/i }),
    ).toHaveAttribute("href", "/en/work/ledger-engine");
  });

  it("shows role, summary, and stack", () => {
    render(<ProjectCard project={project} lang="en" />);
    expect(screen.getByText(/lead backend engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/distributed double-entry/i)).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
  });

  it("shows the category", () => {
    render(<ProjectCard project={project} lang="en" />);
    expect(screen.getByText(/systems/i)).toBeInTheDocument();
  });

  it("scopes the subject and exposes glow hooks", () => {
    const { container } = render(<ProjectCard project={project} lang="en" />);
    const article = container.querySelector("article")!;
    expect(article).toHaveClass("card-glow");
    expect(article).toHaveAttribute("data-glow-row");
    expect(article).toHaveAttribute("data-subject", "systems"); // category "systems"
    const edge = article.querySelector(".card-edge-light")!;
    expect(edge).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("ul.card-pills")).not.toBeNull();
  });
});
