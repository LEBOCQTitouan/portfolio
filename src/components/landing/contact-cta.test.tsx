import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContactCta } from "./contact-cta";
import { en } from "@/i18n/dictionaries/en";

describe("ContactCta", () => {
  it("renders a mailto primary action and a GitHub link", () => {
    render(<ContactCta t={en.contact} />);
    const email = screen.getByRole("link", { name: /get in touch/i });
    expect(email).toHaveAttribute("href", "mailto:lebocq.titouan@gmail.com");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      expect.stringContaining("github.com"),
    );
  });
});
