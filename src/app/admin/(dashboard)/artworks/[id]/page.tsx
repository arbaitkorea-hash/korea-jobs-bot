import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArtworkForm } from "@/components/admin/artwork-form";

export const metadata = { title: "Редактирование картины" };

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artwork, collections] = await Promise.all([
    prisma.artwork.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    prisma.collection.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!artwork) notFound();

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{artwork.title}</h1>
      <ArtworkForm
        artworkId={artwork.id}
        collections={collections}
        initial={{
          title: artwork.title,
          slug: artwork.slug,
          description: artwork.description,
          story: artwork.story,
          year: artwork.year,
          medium: artwork.medium,
          widthCm: artwork.widthCm,
          heightCm: artwork.heightCm,
          orientation: artwork.orientation,
          dominantColor: artwork.dominantColor,
          status: artwork.status,
          priceOriginalCents: artwork.priceOriginalCents,
          pricePrintCents: artwork.pricePrintCents,
          currency: artwork.currency,
          collectionId: artwork.collectionId,
          featured: artwork.featured,
          published: artwork.published,
          seoTitle: artwork.seoTitle,
          seoDescription: artwork.seoDescription,
          altText: artwork.altText,
          ogTitle: artwork.ogTitle,
          ogDescription: artwork.ogDescription,
          ogImage: artwork.ogImage,
          canonicalUrl: artwork.canonicalUrl,
          images: artwork.images.map((img) => ({
            id: img.id,
            url: img.url,
            thumbUrl: img.url.replace("-full.webp", "-thumb.webp"),
            width: img.width,
            height: img.height,
          })),
        }}
      />
    </div>
  );
}
