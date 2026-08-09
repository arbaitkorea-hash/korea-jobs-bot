"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { artworkAdminSchema } from "@/lib/validation";
import type { UploadedImage } from "@/components/admin/image-uploader";

export type ArtworkFormInput = {
  title: string;
  slug: string;
  description: string;
  story: string;
  year: number | null;
  medium: string;
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
  seoTitle: string;
  seoDescription: string;
  altText: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
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
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  // Публикация запрещена без alt-текста — требование из ТЗ (SEO-валидация в админке).
  if (parsed.data.published && !parsed.data.altText) {
    return { error: "Нельзя опубликовать картину без alt-текста." };
  }

  if (input.images.length === 0 && parsed.data.published) {
    return { error: "Нельзя опубликовать картину без изображения." };
  }

  const existingBySlug = await prisma.artwork.findUnique({ where: { slug: parsed.data.slug } });
  if (existingBySlug && existingBySlug.id !== id) {
    return { error: "Такой slug уже используется другой картиной." };
  }

  const data = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || "",
    story: parsed.data.story || "",
    year: parsed.data.year ?? null,
    medium: parsed.data.medium || "Oil on canvas",
    widthCm: parsed.data.widthCm,
    heightCm: parsed.data.heightCm,
    orientation: parsed.data.orientation,
    dominantColor: parsed.data.dominantColor || "",
    status: parsed.data.status,
    priceOriginalCents: parsed.data.priceOriginalCents,
    pricePrintCents: parsed.data.pricePrintCents ?? null,
    currency: parsed.data.currency,
    collectionId: parsed.data.collectionId || null,
    featured: Boolean(parsed.data.featured),
    published: Boolean(parsed.data.published),
    publishedAt: parsed.data.published ? new Date() : null,
    seoTitle: parsed.data.seoTitle || "",
    seoDescription: parsed.data.seoDescription || "",
    altText: parsed.data.altText || "",
    ogTitle: parsed.data.ogTitle || "",
    ogDescription: parsed.data.ogDescription || "",
    ogImage: parsed.data.ogImage || "",
    canonicalUrl: parsed.data.canonicalUrl || "",
  };

  const artwork = id
    ? await prisma.artwork.update({ where: { id }, data })
    : await prisma.artwork.create({ data: { ...data, position: await nextPosition() } });

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
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${artwork.slug}`);
  revalidatePath("/");

  redirect("/admin/artworks");
}

async function nextPosition() {
  const last = await prisma.artwork.findFirst({ orderBy: { position: "desc" } });
  return (last?.position ?? 0) + 1;
}

export async function deleteArtwork(id: string) {
  await requireSession();
  const artwork = await prisma.artwork.delete({ where: { id } });
  revalidatePath("/admin/artworks");
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${artwork.slug}`);
}

export async function reorderArtworks(orderedIds: string[]) {
  await requireSession();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.artwork.update({ where: { id }, data: { position: index } })),
  );
  revalidatePath("/admin/artworks");
  revalidatePath("/gallery");
  revalidatePath("/");
}
