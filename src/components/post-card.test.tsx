import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostCard } from "@/components/post-card";
import type { Post } from "@/core/domain/post";

const post: Post = {
  slug: "designing-for-failure",
  title: "Designing for Failure",
  date: "2026-01-15",
  summary: "Resilient systems assume things break.",
  tags: ["systems"],
  draft: false,
  readingTimeMinutes: 4,
  content: "",
};

describe("PostCard", () => {
  it("links to the post", () => {
    render(<PostCard post={post} />);
    expect(
      screen.getByRole("link", { name: /designing for failure/i }),
    ).toHaveAttribute("href", "/blog/designing-for-failure");
  });

  it("shows the summary and reading time", () => {
    render(<PostCard post={post} />);
    expect(screen.getByText(/resilient systems/i)).toBeInTheDocument();
    expect(screen.getByText(/4 min read/i)).toBeInTheDocument();
  });
});
