import { prisma } from "@/lib/prisma";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { emptyArtworkTranslation } from "@/lib/admin-defaults";

export const metadata = { title: "Новая работа" };

export default async function NewArtworkPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { translations: { where: { locale: "RU" } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Новая работа</h1>
      <ArtworkForm
        artworkId={null}
        collections={collections.map((c) => ({
          id: c.id,
          title: c.translations[0]?.title ?? "(без названия)",
        }))}
        initial={{
          year: new Date().getFullYear(),
          technique: "OIL",
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
          ogImage: "",
          translations: {
            ru: emptyArtworkTranslation(),
            en: emptyArtworkTranslation(),
            ko: emptyArtworkTranslation(),
          },
          images: [],
        }}
      />
    </div>
  );
}
