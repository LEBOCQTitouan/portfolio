"use client";

import { useState } from "react";
import { useT } from "@/i18n/use-t";
import { buttonClass, panelClass } from "@/components/ui/styles";

type Status = "idle" | "loading" | "success" | "error";

export function Newsletter() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(t.newsletter.success);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data?.error ?? t.newsletter.error);
      }
    } catch {
      setStatus("error");
      setMessage(t.newsletter.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className={panelClass()}>
      <p className="font-semibold tracking-tight">{t.newsletter.title}</p>
      <p className="mt-1 text-sm text-muted">{t.newsletter.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label={t.newsletter.emailLabel}
          placeholder={t.newsletter.placeholder}
          className="min-w-0 flex-1 rounded-input border border-border bg-background px-3 py-2 text-sm transition-[border-color,box-shadow] duration-[var(--dur-micro)] hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={buttonClass("primary", "disabled:opacity-60 disabled:pointer-events-none")}
        >
          {status === "loading" ? "…" : t.newsletter.submit}
        </button>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
