import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExhibitionForm } from "@/components/admin/exhibition-form";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import type { ExhibitionTranslationInput } from "@/app/(admin)/admin/(dashboard)/exhibitions/actions";

export const metadata = { title: "Редактирование выставки" };

export default async function EditExhibitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exhibition = await prisma.exhibition.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!exhibition) notFound();

  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const t = exhibition.translations.find((tr) => tr.locale === toPrismaLocale(locale));
      return [
        locale,
        {
          title: t?.title ?? "",
          location: t?.location ?? "",
          description: t?.description ?? "",
        } satisfies ExhibitionTranslationInput,
      ];
    }),
  ) as Record<AppLocale, ExhibitionTranslationInput>;

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{translations.ru.title || "Выставка"}</h1>
      <ExhibitionForm
        id={exhibition.id}
        initial={{
          startDate: exhibition.startDate.toISOString().slice(0, 10),
          endDate: exhibition.endDate ? exhibition.endDate.toISOString().slice(0, 10) : "",
          imageUrl: exhibition.imageUrl,
          pressUrl: exhibition.pressUrl,
          translations,
        }}
      />
    </div>
  );
}
