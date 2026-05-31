export type SubscribeResult = { ok: true } | { ok: false; reason: "invalid" | "unavailable" | "failed" };

export interface SubscriptionGateway {
  subscribe(email: string): Promise<SubscribeResult>;
}
