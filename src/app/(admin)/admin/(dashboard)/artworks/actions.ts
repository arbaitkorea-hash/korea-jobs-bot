"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { artworkAdminSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import type { UploadedImage } from "@/components/admin/image-uploader";

export type ArtworkTranslationInput = {
  slug: string;
  title: string;
  description: string;
  story: string;
  altText: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string;
  hashtags: string;
  canonicalUrl: string;
};

export type ArtworkFormInput = {
  year: number | null;
  technique: "OIL" | "ACRYLIC" | "MIXED";
  widthCm: number;
  heightCm: number;
  orientation: "LANDSCAPE" | "PORTRAIT" | "SQUARE";
  dominantColor: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  priceOriginalCents: number;
  pricePrintCents: number | null;
  currency: string;
  collectionId: string | null;
  featured: boolean;
  published: boolean;
  ogImage: string;
  translations: Record<AppLocale, ArtworkTranslationInput>;
  images: UploadedImage[];
};

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function saveArtwork(id: string | null, input: ArtworkFormInput) {
  await requireSession();

  const parsed = artworkAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const data = parsed.data;

  // Требования публикации: alt-текст на всех трёх языках + хотя бы одно изображение.
  if (data.published) {
    const missingAlt = LOCALES.filter((l) => !data.translations[l].altText.trim());
    if (missingAlt.length > 0) {
      return {
        error: `Нельзя опубликовать без alt-текста. Не заполнено: ${missingAlt.join(", ").toUpperCase()}`,
      };
    }
    if (input.images.length === 0) {
      return { error: "Нельзя опубликовать работу без изображения." };
    }
  }

  // Slug уникален в паре (язык, slug) — проверяем заранее, чтобы отдать
  // понятную ошибку вместо необработанного нарушения constraint из БД.
  for (const locale of LOCALES) {
    const slug = data.translations[locale].slug;
    const clash = await prisma.artworkTranslation.findFirst({
      where: { locale: toPrismaLocale(locale), slug, ...(id ? { artworkId: { not: id } } : {}) },
    });
    if (clash) {
      return { error: `Slug "${slug}" (${locale.toUpperCase()}) уже занят другой работой.` };
    }
  }

  const core = {
    year: data.year ?? null,
    technique: data.technique,
    widthCm: data.widthCm,
    heightCm: data.heightCm,
    orientation: data.orientation,
    dominantColor: data.dominantColor,
    status: data.status,
    priceOriginalCents: data.priceOriginalCents,
    pricePrintCents: data.pricePrintCents ?? null,
    currency: data.currency,
    collectionId: data.collectionId || null,
    featured: data.featured,
    published: data.published,
    publishedAt: data.published ? new Date() : null,
    ogImage: data.ogImage,
  };

  const artwork = id
    ? await prisma.artwork.update({ where: { id }, data: core })
    : await prisma.artwork.create({ data: { ...core, position: await nextPosition() } });

  // Переводы: upsert по (artworkId, locale) — правки не создают дублей.
  for (const locale of LOCALES) {
    const t = data.translations[locale];
    const payload = {
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
    };
    await prisma.artworkTranslation.upsert({
      where: { artworkId_locale: { artworkId: artwork.id, locale: toPrismaLocale(locale) } },
      update: payload,
      create: { ...payload, artworkId: artwork.id, locale: toPrismaLocale(locale) },
    });
  }

  await prisma.artworkImage.deleteMany({ where: { artworkId: artwork.id } });
  if (input.images.length > 0) {
    await prisma.artworkImage.createMany({
      data: input.images.map((img, index) => ({
        artworkId: artwork.id,
        url: img.url,
        format: "webp",
        width: img.width,
        height: img.height,
        isPrimary: index === 0,
        position: index,
      })),
    });
  }

  revalidatePath("/admin/artworks");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/gallery`);
    revalidatePath(`/${locale}/gallery/${data.translations[locale].slug}`);
  }

  redirect("/admin/artworks");
}

async function nextPosition() {
  const last = await prisma.artwork.findFirst({ orderBy: { position: "desc" } });
  return (last?.position ?? 0) + 1;
}

export async function deleteArtwork(id: string) {
  await requireSession();
  await prisma.artwork.delete({ where: { id } });
  revalidatePath("/admin/artworks");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/gallery`);
  }
}

export async function reorderArtworks(orderedIds: string[]) {
  await requireSession();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.artwork.update({ where: { id }, data: { position: index } })),
  );
  revalidatePath("/admin/artworks");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/gallery`);
  }
}
