import { prisma } from "@/lib/prisma";

export async function getCollections() {
  return prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: { select: { artworks: { where: { published: true } } } },
      artworks: {
        where: { published: true },
        take: 1,
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}
