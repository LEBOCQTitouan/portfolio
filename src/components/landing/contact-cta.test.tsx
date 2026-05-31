import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContactCta } from "./contact-cta";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

function renderContactCta() {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <ContactCta />
    </TranslationProvider>,
  );
}

describe("ContactCta", () => {
  it("renders a mailto primary action and a GitHub link", () => {
    renderContactCta();
    const email = screen.getByRole("link", { name: /get in touch/i });
    expect(email).toHaveAttribute("href", "mailto:lebocq.titouan@gmail.com");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      expect.stringContaining("github.com"),
    );
  });
});
