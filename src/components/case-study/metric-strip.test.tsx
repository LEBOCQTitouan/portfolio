import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricStrip } from "@/components/case-study/metric-strip";

describe("MetricStrip", () => {
  it("renders a cell per metric", () => {
    render(
      <MetricStrip
        metrics={[
          { value: "12ms", label: "p99 latency" },
          { value: "10k/s", label: "throughput" },
        ]}
      />,
    );
    expect(screen.getByText("12ms")).toBeInTheDocument();
    expect(screen.getByText(/p99 latency/i)).toBeInTheDocument();
    expect(screen.getByText("10k/s")).toBeInTheDocument();
  });

  it("renders nothing when there are no metrics", () => {
    const { container } = render(<MetricStrip metrics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
