"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/gallery", label: "Галерея" },
  { href: "/collections", label: "Коллекции" },
  { href: "/about", label: "О художнике" },
  { href: "/blog", label: "Блог" },
  { href: "/exhibitions", label: "Выставки" },
  { href: "/contact", label: "Контакты" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wide">
          JST&nbsp;ART
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-fg-muted transition-colors hover:text-fg",
                pathname?.startsWith(item.href) && "text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label="Корзина"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg-muted transition-colors hover:text-fg hover:border-fg"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-contrast">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden"
            aria-label="Меню"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-border lg:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base text-fg-muted hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
