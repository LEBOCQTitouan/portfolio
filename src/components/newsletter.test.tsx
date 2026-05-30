import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Newsletter } from "@/components/newsletter";

describe("Newsletter", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an email input and subscribe button", () => {
    render(<Newsletter />);
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("shows a success message after a successful subscribe", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<Newsletter />);
    await userEvent.type(screen.getByRole("textbox", { name: /email/i }), "me@example.com");
    await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/thanks|subscribed/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Newsletter is not configured yet." }),
    });
    render(<Newsletter />);
    await userEvent.type(screen.getByRole("textbox", { name: /email/i }), "me@example.com");
    await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/not configured|try again/i)).toBeInTheDocument();
  });
});
