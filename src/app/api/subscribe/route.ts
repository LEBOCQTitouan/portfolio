import { subscribe } from "@/composition/server";

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await subscribe(email);
  if (result.ok) return Response.json({ ok: true });

  switch (result.reason) {
    case "invalid":
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    case "unavailable":
      return Response.json({ error: "Newsletter is not configured yet." }, { status: 503 });
    default:
      return Response.json({ error: "Subscription failed. Please try again later." }, { status: 502 });
  }
}
