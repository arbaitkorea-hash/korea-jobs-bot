import type { Metadata } from "next";
import { getGalleryArtworks } from "@/lib/data/artworks";
import { getCollections } from "@/lib/data/collections";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { Container } from "@/components/ui/container";
import { GalleryFilters } from "@/components/gallery/gallery-filters";
import type { Orientation } from "@prisma/client";

export const metadata: Metadata = {
  title: "Галерея",
  description: "Все картины Jung Sen Tek: оригиналы маслом и авторские принты.",
  alternates: { canonical: "/gallery" },
};

export const revalidate = 3600;

type SearchParams = Promise<{
  collection?: string;
  orientation?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}>;

export default async function GalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const [artworks, collections] = await Promise.all([
    getGalleryArtworks({
      collection: params.collection,
      orientation: params.orientation as Orientation | undefined,
      minPrice: params.minPrice ? Number(params.minPrice) * 100 : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) * 100 : undefined,
      sort: params.sort as "newest" | "price-asc" | "price-desc" | undefined,
    }),
    getCollections(),
  ]);

  return (
    <Container className="py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-serif text-4xl">Галерея</h1>
        <p className="mt-4 text-fg-muted">
          {artworks.length} работ{artworks.length === 1 ? "а" : ""} в наличии и на выставке.
        </p>
      </header>

      <GalleryFilters collections={collections.map((c) => ({ slug: c.slug, title: c.title }))} />

      {artworks.length === 0 ? (
        <p className="mt-16 text-fg-muted">По этим фильтрам картин не найдено.</p>
      ) : (
        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </Container>
  );
}
