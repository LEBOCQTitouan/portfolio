import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CloudflareTracker } from "@/adapters/analytics/cloudflare-tracker";

describe("CloudflareTracker", () => {
  it("renders nothing when no Cloudflare beacon token is configured", () => {
    const { container } = render(<>{CloudflareTracker.Beacon()}</>);
    expect(container).toBeEmptyDOMElement();
  });
});
