import { prisma } from "@/lib/prisma";
import type { Orientation, Prisma } from "@prisma/client";

export type GalleryFilters = {
  collection?: string;
  orientation?: Orientation;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
};

const publicArtworkInclude = {
  images: { orderBy: { position: "asc" as const } },
  collection: true,
  tags: { include: { tag: true } },
};

export async function getGalleryArtworks(filters: GalleryFilters = {}) {
  const where: Prisma.ArtworkWhereInput = {
    published: true,
    ...(filters.collection ? { collection: { slug: filters.collection } } : {}),
    ...(filters.orientation ? { orientation: filters.orientation } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          priceOriginalCents: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ArtworkOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { priceOriginalCents: "asc" }
      : filters.sort === "price-desc"
        ? { priceOriginalCents: "desc" }
        : filters.sort === "newest"
          ? { publishedAt: "desc" }
          : { position: "asc" };

  return prisma.artwork.findMany({
    where,
    orderBy,
    include: publicArtworkInclude,
  });
}

export async function getFeaturedArtworks(take = 6) {
  return prisma.artwork.findMany({
    where: { published: true, featured: true },
    orderBy: { position: "asc" },
    take,
    include: publicArtworkInclude,
  });
}

export async function getArtworkBySlug(slug: string) {
  return prisma.artwork.findFirst({
    where: { slug, published: true },
    include: publicArtworkInclude,
  });
}

export async function getRelatedArtworks(artworkId: string, collectionId: string | null, take = 4) {
  if (!collectionId) return [];
  return prisma.artwork.findMany({
    where: {
      published: true,
      collectionId,
      id: { not: artworkId },
    },
    take,
    include: publicArtworkInclude,
  });
}

export async function incrementArtworkViews(artworkId: string) {
  await prisma.artwork.update({
    where: { id: artworkId },
    data: { views: { increment: 1 } },
  });
}

export async function incrementArtworkBuyClicks(artworkId: string) {
  await prisma.artwork.update({
    where: { id: artworkId },
    data: { buyClicks: { increment: 1 } },
  });
}

export async function getAllPublishedSlugs() {
  const artworks = await prisma.artwork.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return artworks.map((a) => a.slug);
}
