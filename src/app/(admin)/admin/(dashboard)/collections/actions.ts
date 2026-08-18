"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { collectionAdminSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type CollectionTranslationInput = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  hashtags: string;
  canonicalUrl: string;
};

export type CollectionFormInput = {
  ogImage: string;
  translations: Record<AppLocale, CollectionTranslationInput>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function saveCollection(id: string | null, input: CollectionFormInput) {
  await requireSession();

  const parsed = collectionAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const data = parsed.data;

  for (const locale of LOCALES) {
    const slug = data.translations[locale].slug;
    const clash = await prisma.collectionTranslation.findFirst({
      where: { locale: toPrismaLocale(locale), slug, ...(id ? { collectionId: { not: id } } : {}) },
    });
    if (clash) {
      return { error: `Slug "${slug}" (${locale.toUpperCase()}) уже занят другой коллекцией.` };
    }
  }

  const collection = id
    ? await prisma.collection.update({ where: { id }, data: { ogImage: data.ogImage } })
    : await prisma.collection.create({
        data: { ogImage: data.ogImage, position: await nextPosition() },
      });

  for (const locale of LOCALES) {
    const t = data.translations[locale];
    const payload = {
      slug: t.slug,
      title: t.title,
      description: t.description,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      keywords: t.keywords,
      hashtags: t.hashtags,
      canonicalUrl: t.canonicalUrl,
    };
    await prisma.collectionTranslation.upsert({
      where: {
        collectionId_locale: { collectionId: collection.id, locale: toPrismaLocale(locale) },
      },
      update: payload,
      create: { ...payload, collectionId: collection.id, locale: toPrismaLocale(locale) },
    });
  }

  revalidatePath("/admin/collections");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/collections`);
    revalidatePath(`/${locale}/collections/${data.translations[locale].slug}`);
  }

  redirect("/admin/collections");
}

async function nextPosition() {
  const last = await prisma.collection.findFirst({ orderBy: { position: "desc" } });
  return (last?.position ?? 0) + 1;
}

export async function deleteCollection(id: string) {
  await requireSession();
  await prisma.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
  for (const locale of LOCALES) revalidatePath(`/${locale}/collections`);
}
