"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
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
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось отправить заказ. Попробуйте ещё раз.");
      setStatus("error");
      return;
    }

    clear();
    router.push("/checkout/success");
  }

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl">Корзина пуста</h1>
        <Link href="/gallery" className="mt-6 inline-block underline underline-offset-4">
          Перейти в галерею
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">Оформление заказа</h1>
      <p className="mt-4 max-w-xl text-fg-muted">
        Это заявка на покупку — мы свяжемся с вами для подтверждения наличия и способа оплаты.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div>
            <label htmlFor="customerName" className="block text-sm text-fg-muted">Имя</label>
            <input id="customerName" name="customerName" required minLength={2} maxLength={100} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-fg-muted">Email</label>
            <input id="email" name="email" type="email" required maxLength={200} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm text-fg-muted">Телефон</label>
            <input id="phone" name="phone" maxLength={50} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm text-fg-muted">Адрес доставки (для принтов)</label>
            <textarea id="address" name="address" maxLength={500} rows={3} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm text-fg-muted">Комментарий</label>
            <textarea id="message" name="message" maxLength={2000} rows={3} className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2" />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Отправка…" : "Отправить заявку"}
          </Button>
        </form>

        <aside className="h-fit rounded border border-border p-6">
          <h2 className="font-serif text-lg">Ваш заказ</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={`${item.artworkId}-${item.variant}`} className="flex justify-between">
                <span>{item.title} × {item.quantity}</span>
                <span>{formatPrice(item.priceCents * item.quantity, item.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-4 text-base">
            Итого: {formatPrice(subtotalCents, items[0].currency)}
          </p>
        </aside>
      </div>
    </Container>
  );
}
