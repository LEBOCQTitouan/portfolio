import { describe, it, expect, vi, afterEach } from "vitest";
import { ButtondownGateway } from "./buttondown-gateway";

afterEach(() => vi.restoreAllMocks());

describe("ButtondownGateway", () => {
  it("returns unavailable when no API key is set", async () => {
    const gw = new ButtondownGateway(undefined);
    expect(await gw.subscribe("a@b.co")).toEqual({ ok: false, reason: "unavailable" });
  });
  it("POSTs to Buttondown and returns ok on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const gw = new ButtondownGateway("key");
    expect(await gw.subscribe("a@b.co")).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.buttondown.email/v1/subscribers",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it("returns failed on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));
    expect(await new ButtondownGateway("key").subscribe("a@b.co")).toEqual({ ok: false, reason: "failed" });
  });
});
