import { prisma } from "@/lib/prisma";
import type { ColorFamily, Orientation, Prisma, Technique } from "@prisma/client";
import { LOCALES, toPrismaLocale, fromPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type GalleryFilters = {
  collection?: string;
  technique?: Technique;
  colorFamily?: ColorFamily;
  orientation?: Orientation;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
  /** Поисковый запрос — тот самый ?q=, что заявлен в SearchAction JSON-LD. */
  q?: string;
};

/** Плоское представление картины на одном языке — то, что реально нужно компонентам. */
export type ArtworkView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  story: string;
  altText: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  keywords: string;
  hashtags: string;
  technique: Technique;
  year: number | null;
  widthCm: number;
  heightCm: number;
  orientation: Orientation;
  /** HEX преобладающего цвета — им подкрашиваем авто-обложку для соцсетей. */
  dominantColor: string;
  status: string;
  priceOriginalCents: number;
  pricePrintCents: number | null;
  currency: string;
  images: { url: string; width: number; height: number }[];
  collection: { slug: string; title: string } | null;
  /** slug'и всех языковых версий — нужны для hreflang и переключателя языка. */
  slugByLocale: Partial<Record<AppLocale, string>>;
};

const artworkInclude = {
  images: { orderBy: { position: "asc" as const } },
  translations: true,
  collection: { include: { translations: true } },
};

type ArtworkWithRelations = Prisma.ArtworkGetPayload<{ include: typeof artworkInclude }>;

function toView(artwork: ArtworkWithRelations, locale: AppLocale): ArtworkView | null {
  const target = toPrismaLocale(locale);
  const t = artwork.translations.find((tr) => tr.locale === target);
  if (!t) return null;

  const slugByLocale: Partial<Record<AppLocale, string>> = {};
  for (const tr of artwork.translations) {
    slugByLocale[fromPrismaLocale(tr.locale)] = tr.slug;
  }

  const collectionTranslation = artwork.collection?.translations.find(
    (tr) => tr.locale === target,
  );

  return {
    id: artwork.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    story: t.story,
    altText: t.altText,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    ogTitle: t.ogTitle,
    ogDescription: t.ogDescription,
    ogImage: artwork.ogImage,
    canonicalUrl: t.canonicalUrl,
    keywords: t.keywords,
    hashtags: t.hashtags,
    technique: artwork.technique,
    year: artwork.year,
    widthCm: artwork.widthCm,
    heightCm: artwork.heightCm,
    orientation: artwork.orientation,
    dominantColor: artwork.dominantColor,
    status: artwork.status,
    priceOriginalCents: artwork.priceOriginalCents,
    pricePrintCents: artwork.pricePrintCents,
    currency: artwork.currency,
    images: artwork.images.map((i) => ({ url: i.url, width: i.width, height: i.height })),
    collection:
      artwork.collection && collectionTranslation
        ? { slug: collectionTranslation.slug, title: collectionTranslation.title }
        : null,
    slugByLocale,
  };
}

export async function getGalleryArtworks(
  locale: AppLocale,
  filters: GalleryFilters = {},
): Promise<ArtworkView[]> {
  const target = toPrismaLocale(locale);

  const query = filters.q?.trim();

  const where: Prisma.ArtworkWhereInput = {
    published: true,
    // Поиск идёт по переводу текущего языка: ищем в названии, описании и
    // ключевых словах, чтобы корейский запрос не искался по русским полям.
    translations: {
      some: {
        locale: target,
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { story: { contains: query, mode: "insensitive" } },
                { keywords: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    ...(filters.collection
      ? { collection: { translations: { some: { locale: target, slug: filters.collection } } } }
      : {}),
    ...(filters.technique ? { technique: filters.technique } : {}),
    ...(filters.colorFamily ? { colorFamily: filters.colorFamily } : {}),
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

  const rows = await prisma.artwork.findMany({ where, orderBy, include: artworkInclude });
  return rows.map((r) => toView(r, locale)).filter((v): v is ArtworkView => v !== null);
}

export async function getFeaturedArtworks(locale: AppLocale, take = 6): Promise<ArtworkView[]> {
  const rows = await prisma.artwork.findMany({
    where: {
      published: true,
      featured: true,
      translations: { some: { locale: toPrismaLocale(locale) } },
    },
    orderBy: { position: "asc" },
    take,
    include: artworkInclude,
  });
  return rows.map((r) => toView(r, locale)).filter((v): v is ArtworkView => v !== null);
}

export async function getArtworkBySlug(
  locale: AppLocale,
  slug: string,
): Promise<ArtworkView | null> {
  const artwork = await prisma.artwork.findFirst({
    where: {
      published: true,
      translations: { some: { locale: toPrismaLocale(locale), slug } },
    },
    include: artworkInclude,
  });
  return artwork ? toView(artwork, locale) : null;
}

export async function getRelatedArtworks(
  locale: AppLocale,
  artworkId: string,
  collectionSlug: string | null,
  take = 4,
): Promise<ArtworkView[]> {
  if (!collectionSlug) return [];
  const target = toPrismaLocale(locale);

  const rows = await prisma.artwork.findMany({
    where: {
      published: true,
      id: { not: artworkId },
      collection: { translations: { some: { locale: target, slug: collectionSlug } } },
      translations: { some: { locale: target } },
    },
    take,
    include: artworkInclude,
  });
  return rows.map((r) => toView(r, locale)).filter((v): v is ArtworkView => v !== null);
}

/** Для generateStaticParams: пары (язык, slug) всех опубликованных работ. */
export async function getPublishedArtworkParams(): Promise<{ lang: AppLocale; slug: string }[]> {
  const translations = await prisma.artworkTranslation.findMany({
    where: { artwork: { published: true } },
    select: { locale: true, slug: true },
  });
  return translations.map((t) => ({ lang: fromPrismaLocale(t.locale), slug: t.slug }));
}

export async function incrementArtworkViews(artworkId: string) {
  await prisma.artwork.update({
    where: { id: artworkId },
    data: { views: { increment: 1 } },
  });
}

/** Все URL работ для sitemap, сгруппированные по языкам. */
export async function getArtworkSitemapEntries() {
  const artworks = await prisma.artwork.findMany({
    where: { published: true },
    select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
  });

  return artworks.map((a) => ({
    updatedAt: a.updatedAt,
    slugByLocale: Object.fromEntries(
      a.translations.map((t) => [fromPrismaLocale(t.locale), t.slug]),
    ) as Partial<Record<AppLocale, string>>,
  }));
}

export { LOCALES };
