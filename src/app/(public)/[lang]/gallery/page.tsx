import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Orientation, Technique } from "@prisma/client";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getGalleryArtworks } from "@/lib/data/artworks";
import { getCollections } from "@/lib/data/collections";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { GalleryFilters } from "@/components/gallery/gallery-filters";
import { Container } from "@/components/ui/container";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 3600;

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.gallery.title,
    description: dict.gallery.subtitle,
    alternates: buildAlternates(lang, "/gallery"),
  };
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const sp = await searchParams;
  const dict = await getDictionary(lang);

  const [artworks, collections] = await Promise.all([
    getGalleryArtworks(lang, {
      q: sp.q,
      collection: sp.collection,
      technique: sp.technique as Technique | undefined,
      orientation: sp.orientation as Orientation | undefined,
      minPrice: sp.minPrice ? Number(sp.minPrice) * 100 : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) * 100 : undefined,
      sort: sp.sort as "newest" | "price-asc" | "price-desc" | undefined,
    }),
    getCollections(lang),
  ]);

  return (
    <Container className="py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-4xl">{dict.gallery.title}</h1>
        <p className="mt-4 text-fg-muted">
          {artworks.length} {dict.gallery.countLabel}
        </p>
      </header>

      <GalleryFilters
        locale={lang}
        dict={dict}
        collections={collections.map((c) => ({ slug: c.slug, title: c.title }))}
        current={sp}
      />

      {artworks.length === 0 ? (
        <p className="mt-16 text-fg-muted">{dict.gallery.empty}</p>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork, i) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              locale={lang}
              dict={dict}
              priority={i < 3}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
