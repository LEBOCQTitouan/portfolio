import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("@giscus/react", () => ({
  default: () => <div data-testid="giscus" />,
}));

import { Comments } from "@/components/comments";

describe("Comments", () => {
  it("renders nothing when giscus env is not configured", () => {
    const { container } = render(<Comments />);
    expect(container).toBeEmptyDOMElement();
  });
});
