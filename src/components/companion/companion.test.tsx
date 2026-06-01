import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Companion } from "./companion";
import { MockIntersectionObserver, setMatchMedia } from "../../../vitest.setup";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/";
  window.localStorage.clear();
  document.body.innerHTML = "";
  // Disable typewriter animation in tests so text appears synchronously.
  setMatchMedia("(prefers-reduced-motion: reduce)", true);
});

function withProvider(ui: React.ReactElement) {
  return (
    <TranslationProvider dictionary={en} lang="en">
      {ui}
    </TranslationProvider>
  );
}

/** Render the companion alongside DOM sections it can observe. */
function renderWithSections(ids: string[]) {
  document.body.innerHTML = ids
    .map((id) => `<div data-narrate="${id}" style="height:200px"></div>`)
    .join("");
  return render(withProvider(<Companion />));
}

describe("Companion", () => {
  it("renders nothing on blog routes", () => {
    pathname = "/blog/designing-for-failure";
    const { container } = render(withProvider(<Companion />));
    expect(container.querySelector(".companion-orb")).toBeNull();
  });

  it("shows the active section's line and mood as it becomes visible", () => {
    renderWithSections(["hero", "pillars", "work", "writing"]);
    const io = MockIntersectionObserver.instances[0];
    act(() => {
      io.trigger([
        { target: document.querySelector('[data-narrate="pillars"]')!, isIntersecting: true, intersectionRatio: 0.9 },
        { target: document.querySelector('[data-narrate="hero"]')!, isIntersecting: true, intersectionRatio: 0.1 },
      ]);
    });
    expect(screen.getByText("I live where systems thinking meets interface craft.")).toBeInTheDocument();
    expect(document.querySelector(".companion-orb")?.getAttribute("data-mood")).toBe("focused");
  });

  it("mutes and persists when the control is clicked", async () => {
    renderWithSections(["hero"]);
    await userEvent.click(screen.getByRole("button", { name: /mute site companion/i }));
    expect(window.localStorage.getItem("companion-muted")).toBe("true");
    expect(screen.getByRole("button", { name: /unmute site companion/i })).toBeInTheDocument();
  });

  it("does not enter hero phase when there is no orb-home element (other routes)", () => {
    renderWithSections(["hero", "pillars"]); // no [data-orb-home]
    const orb = document.querySelector(".companion-orb") as HTMLElement;
    // V0: small companion (no inline width from hero geometry)
    expect(orb).toBeInTheDocument();
    expect(orb.style.width).toBe("");
  });

  it("enters hero phase (large aura) when an orb-home element is present and at top of page", () => {
    // Allow motion so hero phase is not gated off by reduced-motion.
    setMatchMedia("(prefers-reduced-motion: reduce)", false);
    setMatchMedia("(min-width: 1280px)", true);
    document.body.innerHTML =
      `<section data-orb-home style="height:800px"></section>` +
      ["hero", "pillars"].map((id) => `<div data-narrate="${id}" style="height:300px"></div>`).join("");
    render(withProvider(<Companion />));
    const orb = document.querySelector(".companion-orb") as HTMLElement;
    // at scrollY 0 the orb is the large aura → inline width is set and large
    expect(parseInt(orb.style.width || "0", 10)).toBeGreaterThan(150);
  });

  it("uses the bottom dock below 1200px", () => {
    setMatchMedia("(min-width: 1280px)", false);
    renderWithSections(["hero", "pillars"]);
    expect(document.querySelector(".companion-bottom-dock")).toBeInTheDocument();
  });

  it("uses the gutter lane at >=1200px", () => {
    setMatchMedia("(min-width: 1280px)", true);
    setMatchMedia("(prefers-reduced-motion: reduce)", false);
    renderWithSections(["hero", "pillars"]);
    expect(document.querySelector(".companion-gutter")).toBeInTheDocument();
  });
});
