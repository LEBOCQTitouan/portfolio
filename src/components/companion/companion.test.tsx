import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Companion } from "./companion";
import { MockIntersectionObserver, setMatchMedia } from "../../../vitest.setup";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/";
  window.localStorage.clear();
  document.body.innerHTML = "";
  // Disable typewriter animation in tests so text appears synchronously.
  setMatchMedia("(prefers-reduced-motion: reduce)", true);
});

/** Render the companion alongside DOM sections it can observe. */
function renderWithSections(ids: string[]) {
  document.body.innerHTML = ids
    .map((id) => `<div data-narrate="${id}" style="height:200px"></div>`)
    .join("");
  return render(<Companion />);
}

describe("Companion", () => {
  it("renders nothing on blog routes", () => {
    pathname = "/blog/designing-for-failure";
    const { container } = render(<Companion />);
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
});
