const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Newsletter is not configured yet." },
      { status: 503 },
    );
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const res = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Subscription failed. Please try again later." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
