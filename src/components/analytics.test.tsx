import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Analytics } from "@/components/analytics";

describe("Analytics", () => {
  it("renders nothing when no Plausible domain is configured", () => {
    const { container } = render(<Analytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
