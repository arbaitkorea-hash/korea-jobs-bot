import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import { emptyArtworkTranslation } from "@/lib/admin-defaults";
import type { ArtworkTranslationInput } from "@/app/(admin)/admin/(dashboard)/artworks/actions";

export const metadata = { title: "Редактирование работы" };

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [artwork, collections] = await Promise.all([
    prisma.artwork.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, translations: true },
    }),
    prisma.collection.findMany({
      orderBy: { position: "asc" },
      include: { translations: { where: { locale: "RU" } } },
    }),
  ]);

  if (!artwork) notFound();

  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const t = artwork.translations.find((tr) => tr.locale === toPrismaLocale(locale));
      if (!t) return [locale, emptyArtworkTranslation()];
      return [
        locale,
        {
          slug: t.slug,
          title: t.title,
          description: t.description,
          story: t.story,
          altText: t.altText,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          ogTitle: t.ogTitle,
          ogDescription: t.ogDescription,
          keywords: t.keywords,
          hashtags: t.hashtags,
          canonicalUrl: t.canonicalUrl,
        } satisfies ArtworkTranslationInput,
      ];
    }),
  ) as Record<AppLocale, ArtworkTranslationInput>;

  const title = translations.ru.title || translations.en.title || "(без названия)";

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{title}</h1>
      <ArtworkForm
        artworkId={artwork.id}
        collections={collections.map((c) => ({
          id: c.id,
          title: c.translations[0]?.title ?? "(без названия)",
        }))}
        initial={{
          year: artwork.year,
          technique: artwork.technique,
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
          ogImage: artwork.ogImage,
          translations,
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
