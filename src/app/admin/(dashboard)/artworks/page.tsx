import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArtworkList } from "@/components/admin/artwork-list";

export const metadata = { title: "Картины" };

export default async function AdminArtworksPage() {
  const artworks = await prisma.artwork.findMany({
    orderBy: { position: "asc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Картины</h1>
        <Link href="/admin/artworks/new">
          <Button>Добавить картину</Button>
        </Link>
      </div>

      <ArtworkList
        initialItems={artworks.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          status: a.status,
          published: a.published,
          priceOriginalCents: a.priceOriginalCents,
          currency: a.currency,
          seoTitle: a.seoTitle,
          seoDescription: a.seoDescription,
          altText: a.altText,
          thumbUrl: a.images[0]?.url,
        }))}
      />

      {artworks.length === 0 && <p className="text-fg-muted">Пока нет картин.</p>}
    </div>
  );
}
