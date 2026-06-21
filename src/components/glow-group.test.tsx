import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GlowGroup } from "@/components/glow-group";

// jsdom lacks PointerEvent; emulate with a MouseEvent + pointerType.
function pointerMove(
  el: Element,
  { clientX, clientY, pointerType = "mouse" }: { clientX: number; clientY: number; pointerType?: string },
) {
  const ev = new MouseEvent("pointermove", { clientX, clientY, bubbles: true });
  Object.defineProperty(ev, "pointerType", { value: pointerType });
  el.dispatchEvent(ev);
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} , ...rect }) as DOMRect;
}

describe("GlowGroup", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sets per-row cursor vars and marks the hovered row on mouse move", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row data-testid="r0" />
        <article data-glow-row data-testid="r1" />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const r0 = container.querySelector('[data-testid="r0"]') as HTMLElement;
    const r1 = container.querySelector('[data-testid="r1"]') as HTMLElement;
    mockRect(r0, { left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 });
    mockRect(r1, { left: 0, top: 100, right: 200, bottom: 200, width: 200, height: 100 });
    window.dispatchEvent(new Event("resize")); // re-measure with mocked rects

    pointerMove(group, { clientX: 50, clientY: 120 });

    expect(group).toHaveAttribute("data-on");
    expect(r1).toHaveAttribute("data-hot"); // y=120 is inside r1
    expect(r0).not.toHaveAttribute("data-hot");
    expect(r0.style.getPropertyValue("--mx")).toBe("50px");
    expect(r0.style.getPropertyValue("--my")).toBe("120px"); // un-clamped
    expect(r1.style.getPropertyValue("--my")).toBe("20px");
  });

  it("ignores non-mouse pointers", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    pointerMove(group, { clientX: 10, clientY: 10, pointerType: "touch" });
    expect(group).not.toHaveAttribute("data-on");
  });

  it("clears state on pointerleave", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row data-testid="r0" />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const r0 = container.querySelector('[data-testid="r0"]') as HTMLElement;
    mockRect(r0, { left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 });
    window.dispatchEvent(new Event("resize"));
    pointerMove(group, { clientX: 10, clientY: 10 });
    group.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
    expect(group).not.toHaveAttribute("data-on");
    expect(r0).not.toHaveAttribute("data-hot");
  });

  it("re-measures when children change", async () => {
    // Spy on prototype so rects are determined at measure()-call-time, after
    // the new DOM nodes exist. r2 lives at top=200..300, r3 at top=300..400.
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const tid = this.getAttribute("data-testid");
      if (tid === "r2") return { left: 0, top: 200, right: 200, bottom: 300, width: 200, height: 100, x: 0, y: 200, toJSON() {} } as DOMRect;
      if (tid === "r3") return { left: 0, top: 300, right: 200, bottom: 400, width: 200, height: 100, x: 0, y: 300, toJSON() {} } as DOMRect;
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} } as DOMRect;
    });

    const { container, rerender } = render(
      <GlowGroup>
        <article key="r0" data-glow-row data-testid="r0" />
        <article key="r1" data-glow-row data-testid="r1" />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;

    // Different keys force React to remove r0/r1 and insert r2/r3 as new DOM
    // nodes — the childList mutation triggers MutationObserver → measure().
    rerender(
      <GlowGroup>
        <article key="r2" data-glow-row data-testid="r2" />
        <article key="r3" data-glow-row data-testid="r3" />
      </GlowGroup>,
    );
    const r2 = container.querySelector('[data-testid="r2"]') as HTMLElement;
    const r3 = container.querySelector('[data-testid="r3"]') as HTMLElement;

    // MutationObserver callbacks are microtasks; flush before asserting.
    await new Promise((r) => setTimeout(r, 0));

    // Move pointer into r3 (y=350 is inside [300, 400)).
    // Only succeeds if measure() re-ran and rows now contains r2/r3.
    pointerMove(group, { clientX: 50, clientY: 350 });

    expect(r3).toHaveAttribute("data-hot");
    expect(r2).not.toHaveAttribute("data-hot");
    expect(r3.style.getPropertyValue("--my")).toBe("50px"); // 350 - 300

    rectSpy.mockRestore();
  });

  it("removes listeners on unmount", () => {
    const { container, unmount } = render(
      <GlowGroup>
        <article data-glow-row />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const groupSpy = vi.spyOn(group, "removeEventListener");
    const windowSpy = vi.spyOn(window, "removeEventListener");
    unmount();
    expect(groupSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(groupSpy).toHaveBeenCalledWith("pointerleave", expect.any(Function));
    expect(windowSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(windowSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    windowSpy.mockRestore();
  });
});
