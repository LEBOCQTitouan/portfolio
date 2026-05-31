import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

export class InMemorySubscriptionGateway implements SubscriptionGateway {
  readonly emails: string[] = [];
  constructor(private readonly result: SubscribeResult = { ok: true }) {}
  async subscribe(email: string): Promise<SubscribeResult> {
    if (this.result.ok) this.emails.push(email);
    return this.result;
  }
}
