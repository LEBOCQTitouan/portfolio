import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { BlogExplorer } from "@/components/blog-explorer";
import type { PostMeta } from "@/lib/posts";

const posts: PostMeta[] = [
  { slug: "a", title: "Designing for Failure", date: "2026-01-15", summary: "Resilient backends.", tags: ["systems"], draft: false, readingTimeMinutes: 4 },
  { slug: "b", title: "The Craft of Interfaces", date: "2026-02-20", summary: "Design and engineering.", tags: ["design"], draft: false, readingTimeMinutes: 2 },
];

describe("BlogExplorer", () => {
  it("lists all posts initially", () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
  });
  it("filters by search query", async () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    await userEvent.type(screen.getByRole("searchbox", { name: /search posts/i }), "failure");
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(screen.queryByText("The Craft of Interfaces")).not.toBeInTheDocument();
  });
  it("filters by toggling a tag", async () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    await userEvent.click(screen.getByRole("button", { name: "design" }));
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
    expect(screen.queryByText("Designing for Failure")).not.toBeInTheDocument();
  });
});
