import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PullQuote } from "@/components/case-study/pull-quote";

describe("PullQuote", () => {
  it("renders the quote and citation", () => {
    render(<PullQuote cite="Lead engineer">Stay correct under load.</PullQuote>);
    expect(screen.getByText(/stay correct under load/i)).toBeInTheDocument();
    expect(screen.getByText(/lead engineer/i)).toBeInTheDocument();
  });

  it("omits the citation when not provided", () => {
    const { container } = render(<PullQuote>No cite here.</PullQuote>);
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
