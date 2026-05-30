import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PillarCard } from "@/components/landing/pillar-card";

describe("PillarCard", () => {
  it("renders label and description inside a link to href", () => {
    render(
      <PillarCard
        label="Systems"
        description="Distributed, fast, reliable backends."
        href="/work"
      />,
    );
    const link = screen.getByRole("link", { name: /systems/i });
    expect(link).toHaveAttribute("href", "/work");
    expect(screen.getByText(/reliable backends/i)).toBeInTheDocument();
  });
});
