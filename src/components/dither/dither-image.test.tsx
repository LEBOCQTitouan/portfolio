import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { setMatchMedia } from "../../../vitest.setup";
import { DitherImage } from "@/components/dither/dither-image";

describe("DitherImage", () => {
  it("falls back to an accessible <img> when WebGL/Canvas are unavailable (jsdom)", async () => {
    render(<DitherImage src="/work/atlas.jpg" alt="Atlas hero" />);
    const img = await screen.findByRole("img", { name: /atlas hero/i });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "/work/atlas.jpg");
  });

  it("exposes the alt text on the rendered surface", async () => {
    render(<DitherImage src="/x.jpg" alt="meaningful caption" />);
    expect(await screen.findByRole("img", { name: /meaningful caption/i })).toBeInTheDocument();
  });

  it("renders the reduced-motion fallback without throwing", async () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<DitherImage src="/y.jpg" alt="reduced" />);
    expect(await screen.findByRole("img", { name: /reduced/i })).toBeInTheDocument();
  });
});
