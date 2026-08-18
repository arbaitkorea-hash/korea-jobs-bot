import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CollectionForm } from "@/components/admin/collection-form";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import { emptyCollectionTranslation } from "@/lib/admin-defaults";
import type { CollectionTranslationInput } from "@/app/(admin)/admin/(dashboard)/collections/actions";

export const metadata = { title: "Редактирование коллекции" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!collection) notFound();

  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const t = collection.translations.find((tr) => tr.locale === toPrismaLocale(locale));
      if (!t) return [locale, emptyCollectionTranslation()];
      return [
        locale,
        {
          slug: t.slug,
          title: t.title,
          description: t.description,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          keywords: t.keywords,
          hashtags: t.hashtags,
          canonicalUrl: t.canonicalUrl,
        } satisfies CollectionTranslationInput,
      ];
    }),
  ) as Record<AppLocale, CollectionTranslationInput>;

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{translations.ru.title || "Коллекция"}</h1>
      <CollectionForm id={collection.id} initial={{ ogImage: collection.ogImage, translations }} />
    </div>
  );
}
