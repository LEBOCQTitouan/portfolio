import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("Companion motion loop re-binding", () => {
  // Drive requestAnimationFrame manually so we can step the spring loop.
  let frames: Map<number, FrameRequestCallback>;
  let nextId: number;

  beforeEach(() => {
    frames = new Map();
    nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++;
      frames.set(id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id);
    });
    setMatchMedia("(min-width: 1280px)", true); // wide
    setMatchMedia("(prefers-reduced-motion: reduce)", false); // motion allowed
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrame(t: number) {
    const pending = [...frames.values()];
    frames.clear();
    act(() => {
      for (const cb of pending) cb(t);
    });
  }

  // Regression: navigating through a no-narration route (e.g. /blog) unmounts the
  // orb. The imperative spring loop was keyed on [motionMode] only, so it never
  // re-bound to the remounted node — it kept driving the detached old node while
  // the new node sat at left:0/top:0, leaving the orb stuck in the top-left corner.
  it("re-binds the spring loop after the orb unmounts on a no-narration route", () => {
    pathname = "/work";
    document.body.innerHTML = `<div data-narrate="overview" style="height:200px"></div>`;
    const { container, rerender } = render(withProvider(<Companion />));
    flushFrame(16);
    const first = container.querySelector<HTMLElement>(".companion-gutter")!;
    expect(first.style.transform).not.toBe(""); // loop positioned the original node

    // Blog has no narration → the whole orb unmounts.
    pathname = "/blog/designing-for-failure";
    rerender(withProvider(<Companion />));
    expect(container.querySelector(".companion-gutter")).toBeNull();

    // Back to a narration route → orb remounts as a NEW node; the loop must
    // re-bind and drive it, otherwise it stays pinned at the top-left corner.
    pathname = "/work";
    rerender(withProvider(<Companion />));
    flushFrame(32);
    const second = container.querySelector<HTMLElement>(".companion-gutter");
    expect(second).not.toBeNull();
    expect(second!.style.transform).not.toBe("");
  });
});
