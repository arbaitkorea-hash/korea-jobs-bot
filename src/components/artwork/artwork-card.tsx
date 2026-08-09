import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export type ArtworkCardData = {
  slug: string;
  title: string;
  widthCm: number;
  heightCm: number;
  priceOriginalCents: number;
  currency: string;
  status: string;
  images: { url: string; width: number; height: number; isPrimary?: boolean }[];
  altText?: string | null;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  const image = artwork.images[0];

  return (
    <Link href={`/gallery/${artwork.slug}`} className="group block">
      <figure className="relative overflow-hidden bg-bg-elevated">
        {image && (
          <Image
            src={image.url}
            alt={artwork.altText || artwork.title}
            width={image.width}
            height={image.height}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {artwork.status !== "AVAILABLE" && (
          <span className="absolute left-3 top-3 rounded-full bg-bg px-3 py-1 text-xs uppercase tracking-wide text-fg-muted">
            {artwork.status === "SOLD" ? "Продано" : "Резерв"}
          </span>
        )}
        <figcaption className="mt-4 flex items-baseline justify-between">
          <div>
            <p className="font-serif text-lg">{artwork.title}</p>
            <p className="text-sm text-fg-muted">
              {artwork.widthCm}×{artwork.heightCm} см
            </p>
          </div>
          <p className="text-sm text-fg-muted">
            {formatPrice(artwork.priceOriginalCents, artwork.currency)}
          </p>
        </figcaption>
      </figure>
    </Link>
  );
}
