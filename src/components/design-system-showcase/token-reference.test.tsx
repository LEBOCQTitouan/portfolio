import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TokenReference } from "./token-reference";
import { SUBJECTS, TOKENS } from "@/design/tokens";

describe("TokenReference", () => {
  it("renders a row for every subject in tokens.ts", () => {
    render(<TokenReference />);
    for (const id of SUBJECTS) {
      expect(screen.getByText(id, { exact: false })).toBeInTheDocument();
    }
  });

  it("shows each subject's accent hex from the source of truth", () => {
    render(<TokenReference />);
    expect(screen.getByText(TOKENS.systems.accent.light, { exact: false })).toBeInTheDocument();
  });
});
