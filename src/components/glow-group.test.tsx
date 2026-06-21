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

  it("removes listeners on unmount", () => {
    const { container, unmount } = render(
      <GlowGroup>
        <article data-glow-row />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const spy = vi.spyOn(group, "removeEventListener");
    unmount();
    expect(spy).toHaveBeenCalledWith("pointermove", expect.any(Function));
  });
});
