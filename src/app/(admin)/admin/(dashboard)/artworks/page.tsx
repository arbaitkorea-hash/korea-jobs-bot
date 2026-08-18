import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArtworkList, type ArtworkRow } from "@/components/admin/artwork-list";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export const metadata = { title: "Работы" };

export default async function AdminArtworksPage() {
  const artworks = await prisma.artwork.findMany({
    orderBy: { position: "asc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      translations: true,
    },
  });

  const rows: ArtworkRow[] = artworks.map((a) => {
    const seoByLocale = Object.fromEntries(
      LOCALES.map((locale) => {
        const t = a.translations.find((tr) => tr.locale === toPrismaLocale(locale));
        return [
          locale,
          {
            slug: t?.slug ?? "",
            title: t?.title ?? "",
            seoTitle: t?.seoTitle ?? "",
            seoDescription: t?.seoDescription ?? "",
            altText: t?.altText ?? "",
          },
        ];
      }),
    ) as ArtworkRow["seoByLocale"];

    const ruTitle = seoByLocale.ru.title;
    const fallback = LOCALES.map((l: AppLocale) => seoByLocale[l].title).find(Boolean);

    return {
      id: a.id,
      title: ruTitle || fallback || "(без названия)",
      published: a.published,
      status: a.status,
      priceOriginalCents: a.priceOriginalCents,
      currency: a.currency,
      thumbUrl: a.images[0]?.url,
      seoByLocale,
    };
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Работы</h1>
        <Link href="/admin/artworks/new">
          <Button>Добавить работу</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-fg-muted">Пока нет работ.</p>
      ) : (
        <ArtworkList initialItems={rows} />
      )}
    </div>
  );
}
