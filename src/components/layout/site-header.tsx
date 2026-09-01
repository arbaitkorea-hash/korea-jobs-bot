"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useCart } from "@/lib/cart-context";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function SiteHeader({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/collections`, label: dict.nav.collections },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/exhibitions`, label: dict.nav.exhibitions },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/shipping`, label: dict.nav.shipping },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="font-serif text-xl tracking-wide whitespace-nowrap">
          JST&nbsp;ART
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-fg-muted transition-colors hover:text-fg whitespace-nowrap",
                pathname?.startsWith(item.href) && "text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <ThemeToggle label={dict.nav.toggleTheme} />
          <Link
            href={`/${locale}/cart`}
            aria-label={dict.nav.cart}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border xl:hidden"
            aria-label={dict.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-border xl:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {nav.map((item) => (
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
