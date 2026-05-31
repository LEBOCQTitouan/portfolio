import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpeechBubble } from "./speech-bubble";

describe("SpeechBubble", () => {
  it("shows the full text immediately when motion is reduced", () => {
    render(<SpeechBubble text="Hello there" reducedMotion={true} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});
