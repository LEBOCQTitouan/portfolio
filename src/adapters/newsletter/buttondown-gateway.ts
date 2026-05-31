import "server-only";
import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

export class ButtondownGateway implements SubscriptionGateway {
  constructor(private readonly apiKey = process.env.BUTTONDOWN_API_KEY) {}
  async subscribe(email: string): Promise<SubscribeResult> {
    if (!this.apiKey) return { ok: false, reason: "unavailable" };
    const res = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: "failed" };
  }
}
