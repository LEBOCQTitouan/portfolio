import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { BlogExplorer } from "@/components/blog-explorer";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";
import type { PostMeta } from "@/core/domain/post";

const posts: PostMeta[] = [
  { slug: "a", title: "Designing for Failure", date: "2026-01-15", summary: "Resilient backends.", tags: ["systems"], draft: false, readingTimeMinutes: 4 },
  { slug: "b", title: "The Craft of Interfaces", date: "2026-02-20", summary: "Design and engineering.", tags: ["design"], draft: false, readingTimeMinutes: 2 },
];

function renderExplorer() {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <BlogExplorer posts={posts} allTags={["systems", "design"]} />
    </TranslationProvider>,
  );
}

describe("BlogExplorer", () => {
  it("lists all posts initially", () => {
    renderExplorer();
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
  });
  it("filters by search query", async () => {
    renderExplorer();
    await userEvent.type(screen.getByRole("searchbox", { name: /search posts/i }), "failure");
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(screen.queryByText("The Craft of Interfaces")).not.toBeInTheDocument();
  });
  it("filters by toggling a tag", async () => {
    renderExplorer();
    await userEvent.click(screen.getByRole("button", { name: "design" }));
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
    expect(screen.queryByText("Designing for Failure")).not.toBeInTheDocument();
  });
});
