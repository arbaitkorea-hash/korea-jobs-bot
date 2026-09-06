import Image from "next/image";
import Link from "next/link";
import type { ArtworkView } from "@/lib/data/artworks";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/utils";

/**
 * Карточка работы.
 *
 * Работа показывается в своих пропорциях и без обрезки: кадр — часть работы,
 * а не иллюстрация к тексту. Ряды из-за этого получаются неровными по низу —
 * и это правильнее, чем загонять живопись в одинаковые квадраты: в квадрате
 * горизонтальный холст становится вдвое мельче вертикального, а подпись
 * отрывается от работы пустым полем.
 *
 * Тень под холстом мягкая и смещена вниз: она читается как предмет на стене,
 * а не как карточка товара с обводкой.
 */
export function ArtworkCard({
  artwork,
  locale,
  dict,
  priority = false,
  hero = false,
}: {
  artwork: ArtworkView;
  locale: AppLocale;
  dict: Dictionary;
  priority?: boolean;
  /** Главная работа блока: крупнее прочих, но с потолком по высоте. */
  hero?: boolean;
}) {
  const image = artwork.images[0];
  const statusLabel =
    artwork.status === "SOLD"
      ? dict.artwork.sold
      : artwork.status === "RESERVED"
        ? dict.artwork.reserved
        : null;

  return (
    <Link href={`/${locale}/gallery/${artwork.slug}`} className="group block">
      <figure className="relative">
        <div className="relative overflow-hidden">
          {image && (
            <Image
              src={image.url}
              alt={artwork.altText || artwork.title}
              width={image.width}
              height={image.height}
              priority={priority}
              className={cn(
                "h-auto w-full object-contain shadow-[0_14px_34px_-22px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02]",
                // Потолок по высоте нужен только главной работе: вертикальный
                // холст без него растягивает блок на два экрана.
                hero && "max-h-[68vh] w-auto",
              )}
              sizes={
                hero
                  ? "(max-width: 1024px) 100vw, 55vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              }
            />
          )}
          {statusLabel && (
            <span className="absolute left-3 top-3 rounded-full bg-bg/90 px-3 py-1 text-xs uppercase tracking-wide text-fg-muted">
              {statusLabel}
            </span>
          )}
        </div>

        <figcaption className="mt-4 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-lg leading-snug">{artwork.title}</p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {dict.technique[artwork.technique]} · {artwork.widthCm}×{artwork.heightCm}{" "}
              {dict.artwork.cm}
            </p>
          </div>
          <p className="shrink-0 text-sm text-fg-muted">
            <Price cents={artwork.priceOriginalCents} currency={artwork.currency} locale={locale} />
          </p>
        </figcaption>
      </figure>
    </Link>
  );
}
