import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TranslationProvider } from "./translation-provider";
import { useT } from "./use-t";
import { en } from "./dictionaries/en";

function Probe() {
  const { t, lang } = useT();
  return <span>{lang}:{t.nav.about}</span>;
}

describe("useT", () => {
  it("exposes the dictionary and lang from context", () => {
    render(
      <TranslationProvider dictionary={en} lang="en">
        <Probe />
      </TranslationProvider>,
    );
    expect(screen.getByText(`en:${en.nav.about}`)).toBeInTheDocument();
  });
});
