import { describe, it, expect } from "vitest";
import { makeSubscribe } from "./subscribe";
import { InMemorySubscriptionGateway } from "@/adapters/newsletter/in-memory-subscription-gateway";

describe("subscribe use-case", () => {
  it("rejects an invalid email without calling the gateway", async () => {
    const gw = new InMemorySubscriptionGateway();
    const res = await makeSubscribe(gw)("not-an-email");
    expect(res).toEqual({ ok: false, reason: "invalid" });
    expect(gw.emails).toEqual([]);
  });
  it("delegates a valid email to the gateway", async () => {
    const gw = new InMemorySubscriptionGateway();
    const res = await makeSubscribe(gw)("a@b.co");
    expect(res).toEqual({ ok: true });
    expect(gw.emails).toEqual(["a@b.co"]);
  });
  it("passes through a gateway failure", async () => {
    const gw = new InMemorySubscriptionGateway({ ok: false, reason: "failed" });
    expect(await makeSubscribe(gw)("a@b.co")).toEqual({ ok: false, reason: "failed" });
  });
});
