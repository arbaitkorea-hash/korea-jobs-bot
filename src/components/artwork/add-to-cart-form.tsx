"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AddToCartForm({
  locale,
  dict,
  artworkId,
  slug,
  title,
  imageUrl,
  currency,
  priceOriginalCents,
  pricePrintCents,
  available,
}: {
  locale: AppLocale;
  dict: Dictionary;
  artworkId: string;
  slug: string;
  title: string;
  imageUrl: string;
  currency: string;
  priceOriginalCents: number;
  pricePrintCents: number | null;
  available: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [variant, setVariant] = useState<"original" | "print">("original");
  const [added, setAdded] = useState(false);

  const price = variant === "original" ? priceOriginalCents : (pricePrintCents ?? 0);

  function handleAdd() {
    add({ artworkId, slug, title, imageUrl, currency, priceCents: price, variant });
    setAdded(true);
  }

  if (!available) {
    return <p className="text-fg-muted">{dict.artwork.soldNote}</p>;
  }

  const pill = "rounded-full border px-4 py-2 transition-colors";

  return (
    <div className="space-y-4">
      {pricePrintCents != null && (
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setVariant("original")}
            aria-pressed={variant === "original"}
            className={cn(pill, variant === "original" ? "border-fg" : "border-border text-fg-muted")}
          >
            {dict.artwork.original} — <Price cents={priceOriginalCents} currency={currency} locale={locale} />
          </button>
          <button
            type="button"
            onClick={() => setVariant("print")}
            aria-pressed={variant === "print"}
            className={cn(pill, variant === "print" ? "border-fg" : "border-border text-fg-muted")}
          >
            {dict.artwork.print} — <Price cents={pricePrintCents} currency={currency} locale={locale} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleAdd}>
          {added ? `${dict.artwork.added} ✓` : dict.artwork.addToCart}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            handleAdd();
            router.push(`/${locale}/checkout`);
          }}
        >
          {dict.artwork.buyNow}
        </Button>
      </div>
    </div>
  );
}
