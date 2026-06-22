import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dimension, TitleBlock, DraftingMarks } from "@/components/blueprint/blueprint-frame";

describe("Dimension", () => {
  it("shows the 768 column and 24 gutter measurements, decorative", () => {
    const { container } = render(<Dimension />);
    expect(screen.getByText("768")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("TitleBlock", () => {
  it("renders the name, static fields, and the current language, decorative", () => {
    const { container } = render(<TitleBlock lang="fr" />);
    expect(screen.getByText("TITOUAN LEBOCQ")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("2026.06")).toBeInTheDocument();
    expect(screen.getByText("FR")).toBeInTheDocument(); // lang upper-cased
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("DraftingMarks", () => {
  it("renders the scale bar caption, decorative", () => {
    const { container } = render(<DraftingMarks />);
    expect(screen.getByText("96px")).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
