import { prisma } from "@/lib/prisma";
import { toPrismaLocale, fromPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type CollectionView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
  artworkCount: number;
  coverImage: { url: string; width: number; height: number } | null;
  coverAlt: string;
  slugByLocale: Partial<Record<AppLocale, string>>;
};

export async function getCollections(locale: AppLocale): Promise<CollectionView[]> {
  const target = toPrismaLocale(locale);

  const rows = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      translations: true,
      _count: { select: { artworks: { where: { published: true } } } },
      artworks: {
        where: { published: true },
        take: 1,
        orderBy: { position: "asc" },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          translations: { where: { locale: target } },
        },
      },
    },
  });

  return rows.flatMap((c) => {
    const t = c.translations.find((tr) => tr.locale === target);
    if (!t) return [];

    const cover = c.artworks[0]?.images[0] ?? null;
    const slugByLocale: Partial<Record<AppLocale, string>> = {};
    for (const tr of c.translations) slugByLocale[fromPrismaLocale(tr.locale)] = tr.slug;

    return [
      {
        id: c.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        keywords: t.keywords,
        canonicalUrl: t.canonicalUrl,
        ogImage: c.ogImage,
        artworkCount: c._count.artworks,
        coverImage: cover
          ? { url: cover.url, width: cover.width, height: cover.height }
          : null,
        coverAlt: c.artworks[0]?.translations[0]?.altText ?? t.title,
        slugByLocale,
      },
    ];
  });
}

export async function getCollectionBySlug(
  locale: AppLocale,
  slug: string,
): Promise<CollectionView | null> {
  const target = toPrismaLocale(locale);

  const collection = await prisma.collection.findFirst({
    where: { translations: { some: { locale: target, slug } } },
    include: {
      translations: true,
      _count: { select: { artworks: { where: { published: true } } } },
    },
  });
  if (!collection) return null;

  const t = collection.translations.find((tr) => tr.locale === target);
  if (!t) return null;

  const slugByLocale: Partial<Record<AppLocale, string>> = {};
  for (const tr of collection.translations) slugByLocale[fromPrismaLocale(tr.locale)] = tr.slug;

  return {
    id: collection.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    keywords: t.keywords,
    canonicalUrl: t.canonicalUrl,
    ogImage: collection.ogImage,
    artworkCount: collection._count.artworks,
    coverImage: null,
    coverAlt: t.title,
    slugByLocale,
  };
}

export async function getCollectionParams(): Promise<{ lang: AppLocale; slug: string }[]> {
  const translations = await prisma.collectionTranslation.findMany({
    select: { locale: true, slug: true },
  });
  return translations.map((t) => ({ lang: fromPrismaLocale(t.locale), slug: t.slug }));
}

export async function getCollectionSitemapEntries() {
  const collections = await prisma.collection.findMany({
    select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
  });
  return collections.map((c) => ({
    updatedAt: c.updatedAt,
    slugByLocale: Object.fromEntries(
      c.translations.map((t) => [fromPrismaLocale(t.locale), t.slug]),
    ) as Partial<Record<AppLocale, string>>,
  }));
}
