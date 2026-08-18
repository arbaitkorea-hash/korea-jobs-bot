import Image from "next/image";
import Link from "next/link";
import type { ArtworkView } from "@/lib/data/artworks";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/utils";

export function ArtworkCard({
  artwork,
  locale,
  dict,
  priority = false,
}: {
  artwork: ArtworkView;
  locale: AppLocale;
  dict: Dictionary;
  priority?: boolean;
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
        <div className="relative overflow-hidden bg-bg-elevated">
          {image && (
            <Image
              src={image.url}
              alt={artwork.altText || artwork.title}
              width={image.width}
              height={image.height}
              priority={priority}
              className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
            {formatPrice(artwork.priceOriginalCents, artwork.currency, locale)}
          </p>
        </figcaption>
      </figure>
    </Link>
  );
}
