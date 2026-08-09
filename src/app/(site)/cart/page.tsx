"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, remove, setQuantity, subtotalCents } = useCart();

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl">Корзина пуста</h1>
        <Link href="/gallery" className="mt-6 inline-block">
          <Button variant="secondary">Перейти в галерею</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">Корзина</h1>

      <ul className="mt-10 divide-y divide-border">
        {items.map((item) => (
          <li key={`${item.artworkId}-${item.variant}`} className="flex gap-6 py-6">
            {item.imageUrl && (
              <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-bg-elevated">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <Link href={`/gallery/${item.slug}`} className="font-serif text-lg hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-sm text-fg-muted">
                    {item.variant === "original" ? "Оригинал" : "Принт"}
                  </p>
                </div>
                <p className="text-sm">{formatPrice(item.priceCents * item.quantity, item.currency)}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-fg-muted">
                  Кол-во
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.artworkId, item.variant, Number(e.target.value))}
                    className="w-16 rounded border border-border bg-bg-elevated px-2 py-1"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => remove(item.artworkId, item.variant)}
                  className="text-fg-muted underline underline-offset-4 hover:text-fg"
                >
                  Удалить
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <p className="text-lg">Итого: {formatPrice(subtotalCents, items[0].currency)}</p>
        <Link href="/checkout">
          <Button>Оформить заказ</Button>
        </Link>
      </div>
    </Container>
  );
}
