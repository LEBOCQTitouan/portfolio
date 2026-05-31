import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostCard } from "@/components/post-card";
import type { Post } from "@/core/domain/post";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

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

function renderPostCard() {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <PostCard post={post} />
    </TranslationProvider>,
  );
}

describe("PostCard", () => {
  it("links to the post", () => {
    renderPostCard();
    expect(
      screen.getByRole("link", { name: /designing for failure/i }),
    ).toHaveAttribute("href", "/en/blog/designing-for-failure");
  });

  it("shows the summary and reading time", () => {
    renderPostCard();
    expect(screen.getByText(/resilient systems/i)).toBeInTheDocument();
    expect(screen.getByText(/4 min read/i)).toBeInTheDocument();
  });
});
