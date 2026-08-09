"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  artworkId: string;
  slug: string;
  title: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  variant: "original" | "print";
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (artworkId: string, variant: CartItem["variant"]) => void;
  setQuantity: (artworkId: string, variant: CartItem["variant"], quantity: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jst-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Читаем корзину из localStorage — синхронизация с внешним хранилищем,
    // недоступным при серверном рендере, поэтому это законное место для эффекта.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue["add"] = (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.artworkId === item.artworkId && i.variant === item.variant,
        );
        if (existing) {
          return prev.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
    };

    const remove: CartContextValue["remove"] = (artworkId, variant) => {
      setItems((prev) =>
        prev.filter((i) => !(i.artworkId === artworkId && i.variant === variant)),
      );
    };

    const setQuantity: CartContextValue["setQuantity"] = (artworkId, variant, quantity) => {
      setItems((prev) =>
        prev.map((i) =>
          i.artworkId === artworkId && i.variant === variant
            ? { ...i, quantity: Math.max(1, quantity) }
            : i,
        ),
      );
    };

    const clear = () => setItems([]);

    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

    return { items, add, remove, setQuantity, clear, count, subtotalCents };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
