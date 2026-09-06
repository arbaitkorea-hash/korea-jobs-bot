"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CheckoutView({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const { items, subtotalCents, clear } = useCart();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
        message: form.get("message"),
        website: form.get("website"), // honeypot
        locale,
        items: items.map((i) => ({
          artworkId: i.artworkId,
          titleSnapshot: i.title,
          variant: i.variant === "original" ? "ORIGINAL" : "PRINT",
          quantity: i.quantity,
          unitPriceCents: i.priceCents,
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || dict.checkout.error);
      setStatus("error");
      return;
    }

    clear();
    router.push(`/${locale}/checkout/success`);
  }

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl">{dict.cart.empty}</h1>
        <Link href={`/${locale}/gallery`} className="mt-6 inline-block underline underline-offset-4">
          {dict.cart.toGallery}
        </Link>
      </Container>
    );
  }

  const field = "mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2";

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">{dict.checkout.title}</h1>
      <p className="mt-4 max-w-xl text-fg-muted">{dict.checkout.intro}</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div>
            <label htmlFor="customerName" className="block text-sm text-fg-muted">
              {dict.checkout.name}
            </label>
            <input id="customerName" name="customerName" required minLength={2} maxLength={100} className={field} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-fg-muted">
              {dict.checkout.email}
            </label>
            <input id="email" name="email" type="email" required maxLength={200} className={field} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm text-fg-muted">
              {dict.checkout.phone}
            </label>
            <input id="phone" name="phone" maxLength={50} className={field} />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm text-fg-muted">
              {dict.checkout.address}
            </label>
            <textarea id="address" name="address" maxLength={500} rows={3} className={field} />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm text-fg-muted">
              {dict.checkout.comment}
            </label>
            <textarea id="message" name="message" maxLength={2000} rows={3} className={field} />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? dict.checkout.submitting : dict.checkout.submit}
          </Button>
        </form>

        <aside className="h-fit rounded border border-border p-6">
          <h2 className="font-serif text-lg">{dict.checkout.yourOrder}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={`${item.artworkId}-${item.variant}`} className="flex justify-between gap-3">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span className="shrink-0">
                  <Price cents={item.priceCents * item.quantity} currency={item.currency} locale={locale} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-4 text-base">
            {dict.cart.total}: <Price cents={subtotalCents} currency={items[0].currency} locale={locale} showBase />
          </p>
        </aside>
      </div>
    </Container>
  );
}
