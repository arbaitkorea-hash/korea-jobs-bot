"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exhibitionAdminSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type ExhibitionTranslationInput = {
  title: string;
  location: string;
  description: string;
};

export type ExhibitionFormInput = {
  /** Даты в формате ГГГГ-ММ-ДД — как их отдаёт <input type="date">. */
  startDate: string;
  endDate: string;
  imageUrl: string;
  pressUrl: string;
  translations: Record<AppLocale, ExhibitionTranslationInput>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

/**
 * Дату из формы считаем календарной, без времени и часового пояса:
 * иначе выставка, начатая 1 марта, в Сеуле показалась бы 28 февраля.
 */
function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function saveExhibition(id: string | null, input: ExhibitionFormInput) {
  await requireSession();

  const parsed = exhibitionAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  const core = {
    startDate: toUtcDate(data.startDate),
    endDate: data.endDate ? toUtcDate(data.endDate) : null,
    imageUrl: data.imageUrl,
    pressUrl: data.pressUrl,
  };

  const exhibition = id
    ? await prisma.exhibition.update({ where: { id }, data: core })
    : await prisma.exhibition.create({ data: { ...core, position: await nextPosition() } });

  for (const locale of LOCALES) {
    const t = data.translations[locale];
    const payload = { title: t.title, location: t.location, description: t.description };
    await prisma.exhibitionTranslation.upsert({
      where: {
        exhibitionId_locale: { exhibitionId: exhibition.id, locale: toPrismaLocale(locale) },
      },
      update: payload,
      create: { ...payload, exhibitionId: exhibition.id, locale: toPrismaLocale(locale) },
    });
  }

  revalidatePath("/admin/exhibitions");
  for (const locale of LOCALES) revalidatePath(`/${locale}/exhibitions`);

  redirect("/admin/exhibitions");
}

async function nextPosition() {
  const last = await prisma.exhibition.findFirst({ orderBy: { position: "desc" } });
  return (last?.position ?? 0) + 1;
}

export async function deleteExhibition(id: string) {
  await requireSession();
  await prisma.exhibition.delete({ where: { id } });
  revalidatePath("/admin/exhibitions");
  for (const locale of LOCALES) revalidatePath(`/${locale}/exhibitions`);
}
