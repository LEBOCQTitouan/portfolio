import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("@giscus/react", () => ({
  default: () => <div data-testid="giscus" />,
}));

import { GiscusRenderer } from "@/adapters/comments/giscus-renderer";

describe("GiscusRenderer", () => {
  it("renders nothing when giscus env is not configured", () => {
    const { container } = render(<>{GiscusRenderer.Comments()}</>);
    expect(container).toBeEmptyDOMElement();
  });
});
