import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function makeSubscribe(gateway: SubscriptionGateway) {
  return async (email: unknown): Promise<SubscribeResult> => {
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return { ok: false, reason: "invalid" };
    }
    return gateway.subscribe(email);
  };
}
