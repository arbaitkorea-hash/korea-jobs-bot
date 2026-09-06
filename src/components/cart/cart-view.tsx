"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CartView({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const { items, remove, setQuantity, subtotalCents } = useCart();

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl">{dict.cart.empty}</h1>
        <Link href={`/${locale}/gallery`} className="mt-6 inline-block">
          <Button variant="secondary">{dict.cart.toGallery}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">{dict.cart.title}</h1>

      <ul className="mt-10 divide-y divide-border">
        {items.map((item) => (
          <li key={`${item.artworkId}-${item.variant}`} className="flex gap-6 py-6">
            {item.imageUrl && (
              <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-bg-elevated">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <Link
                    href={`/${locale}/gallery/${item.slug}`}
                    className="font-serif text-lg hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-fg-muted">
                    {item.variant === "original" ? dict.artwork.original : dict.artwork.print}
                  </p>
                </div>
                <p className="text-sm">
                  <Price cents={item.priceCents * item.quantity} currency={item.currency} locale={locale} />
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-fg-muted">
                  {dict.cart.quantity}
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
                  {dict.cart.remove}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <p className="text-lg">
          {dict.cart.total}: <Price cents={subtotalCents} currency={items[0].currency} locale={locale} showBase />
        </p>
        <Link href={`/${locale}/checkout`}>
          <Button>{dict.cart.checkout}</Button>
        </Link>
      </div>
    </Container>
  );
}
