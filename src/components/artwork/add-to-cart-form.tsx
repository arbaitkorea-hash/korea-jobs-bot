"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function AddToCartForm({
  artworkId,
  slug,
  title,
  imageUrl,
  currency,
  priceOriginalCents,
  pricePrintCents,
  available,
}: {
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
    add({
      artworkId,
      slug,
      title,
      imageUrl,
      currency,
      priceCents: price,
      variant,
    });
    setAdded(true);
  }

  if (!available) {
    return <p className="text-fg-muted">Эта картина продана. Можно заказать похожую работу через контакты.</p>;
  }

  return (
    <div className="space-y-4">
      {pricePrintCents != null && (
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setVariant("original")}
            className={`rounded-full border px-4 py-2 ${variant === "original" ? "border-fg" : "border-border text-fg-muted"}`}
          >
            Оригинал — {formatPrice(priceOriginalCents, currency)}
          </button>
          <button
            type="button"
            onClick={() => setVariant("print")}
            className={`rounded-full border px-4 py-2 ${variant === "print" ? "border-fg" : "border-border text-fg-muted"}`}
          >
            Принт — {formatPrice(pricePrintCents, currency)}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" onClick={handleAdd}>
          {added ? "Добавлено ✓" : "В корзину"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => { handleAdd(); router.push("/checkout"); }}>
          Купить сейчас
        </Button>
      </div>
    </div>
  );
}
