import { prisma } from "@/lib/prisma";
import { ArtworkForm } from "@/components/admin/artwork-form";

export const metadata = { title: "Новая картина" };

export default async function NewArtworkPage() {
  const collections = await prisma.collection.findMany({ orderBy: { position: "asc" } });

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Новая картина</h1>
      <ArtworkForm
        artworkId={null}
        collections={collections}
        initial={{
          title: "",
          slug: "",
          description: "",
          story: "",
          year: new Date().getFullYear(),
          medium: "Oil on canvas",
          widthCm: 0,
          heightCm: 0,
          orientation: "LANDSCAPE",
          dominantColor: "",
          status: "AVAILABLE",
          priceOriginalCents: 0,
          pricePrintCents: null,
          currency: "KRW",
          collectionId: null,
          featured: false,
          published: false,
          seoTitle: "",
          seoDescription: "",
          altText: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
          canonicalUrl: "",
          images: [],
        }}
      />
    </div>
  );
}
