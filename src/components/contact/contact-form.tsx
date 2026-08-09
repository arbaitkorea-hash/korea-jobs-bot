"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось отправить сообщение.");
      setStatus("error");
      return;
    }

    setStatus("success");
    e.currentTarget.reset();
  }

  if (status === "success") {
    return <p className="rounded border border-border p-6 text-fg-muted">Сообщение отправлено, спасибо!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <label htmlFor="name" className="block text-sm text-fg-muted">Имя</label>
        <input id="name" name="name" required minLength={2} maxLength={100} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm text-fg-muted">Email</label>
        <input id="email" name="email" type="email" required maxLength={200} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm text-fg-muted">Сообщение</label>
        <textarea id="message" name="message" required minLength={10} maxLength={2000} rows={5} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Отправка…" : "Отправить"}
      </Button>
    </form>
  );
}
