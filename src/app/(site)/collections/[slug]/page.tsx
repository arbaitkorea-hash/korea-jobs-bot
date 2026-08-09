import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/lib/data/collections";
import { getGalleryArtworks } from "@/lib/data/artworks";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const collections = await prisma.collection.findMany({ select: { slug: true } });
  return collections.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    title: collection.seoTitle || siteConfig.titleTemplate.collection(collection.title),
    description: collection.seoDescription || collection.description,
    alternates: { canonical: collection.canonicalUrl || `/collections/${collection.slug}` },
    openGraph: collection.ogImage ? { images: [collection.ogImage] } : undefined,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const artworks = await getGalleryArtworks({ collection: slug });

  return (
    <Container className="py-16">
      <header className="max-w-2xl">
        <h1 className="font-serif text-4xl">{collection.title}</h1>
        {collection.description && <p className="mt-4 text-fg-muted">{collection.description}</p>}
      </header>

      <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </Container>
  );
}
