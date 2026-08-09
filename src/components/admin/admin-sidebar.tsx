"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/artworks", label: "Картины" },
  { href: "/admin/collections", label: "Коллекции" },
  { href: "/admin/blog", label: "Блог" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/analytics", label: "Аналитика" },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border p-6">
      <p className="font-serif text-lg">JST ART</p>
      <p className="mt-1 text-xs text-fg-muted">{userName}</p>

      <nav className="mt-8 flex flex-col gap-1 text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded px-3 py-2 text-fg-muted hover:bg-bg-elevated hover:text-fg",
              pathname === item.href && "bg-bg-elevated text-fg",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-8 text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
      >
        Выйти
      </button>
    </aside>
  );
}
