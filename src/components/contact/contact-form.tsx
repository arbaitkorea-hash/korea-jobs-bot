"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ContactForm({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    setError("");

    const data = new FormData(form);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        message: data.get("message"),
        website: data.get("website"),
        locale,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || dict.contact.error);
      setStatus("error");
      return;
    }

    form.reset();
    setStatus("success");
  }

  if (status === "success") {
    return (
      <p className="rounded border border-border p-6 text-fg-muted">{dict.contact.success}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <label htmlFor="contact-name" className="block text-sm text-fg-muted">
          {dict.contact.name}
        </label>
        <input
          id="contact-name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm text-fg-muted">
          {dict.contact.email}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={200}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm text-fg-muted">
          {dict.contact.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? dict.contact.submitting : dict.contact.submit}
      </Button>
    </form>
  );
}
