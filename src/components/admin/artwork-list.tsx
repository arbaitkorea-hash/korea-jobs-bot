"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { computeSeoHealth } from "@/lib/seo-health";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { deleteArtwork, reorderArtworks } from "@/app/(admin)/admin/(dashboard)/artworks/actions";
import { formatPrice, cn } from "@/lib/utils";

export type ArtworkRow = {
  id: string;
  title: string;
  published: boolean;
  status: string;
  priceOriginalCents: number;
  currency: string;
  thumbUrl?: string;
  /** Заполненность SEO по каждому языку — «светофор» из ТЗ. */
  seoByLocale: Record<AppLocale, { slug: string; title: string; seoTitle: string; seoDescription: string; altText: string }>;
};

const DOT = { green: "bg-emerald-600", yellow: "bg-amber-500", red: "bg-red-600" };

export function ArtworkList({ initialItems }: { initialItems: ArtworkRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItems(next);
    setDragIndex(null);
    startTransition(() => {
      reorderArtworks(next.map((i) => i.id));
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить работу без возможности восстановления?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteArtwork(id);
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e: DragEvent) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          className="flex items-center gap-4 py-4"
        >
          <GripVertical size={16} className="cursor-grab text-fg-muted" />

          {item.thumbUrl && (
            <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-bg-elevated">
              <Image src={item.thumbUrl} alt="" fill className="object-cover" sizes="48px" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <Link href={`/admin/artworks/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
              <span>{item.published ? "Опубликовано" : "Черновик"}</span>
              <span>{formatPrice(item.priceOriginalCents, item.currency, "ru")}</span>
              <span className="flex items-center gap-2">
                SEO:
                {LOCALES.map((locale) => {
                  const health = computeSeoHealth(item.seoByLocale[locale]);
                  return (
                    <span key={locale} className="inline-flex items-center gap-1" title={`${locale.toUpperCase()}: ${health}`}>
                      <span className={cn("h-2 w-2 rounded-full", DOT[health])} aria-hidden />
                      {locale.toUpperCase()}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDelete(item.id)}
            aria-label="Удалить"
            className="text-fg-muted hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
      {isPending && <p className="pt-2 text-xs text-fg-muted">Сохранение порядка…</p>}
    </ul>
  );
}
