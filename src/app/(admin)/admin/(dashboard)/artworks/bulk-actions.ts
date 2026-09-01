"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bulkArtworksSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale } from "@/lib/i18n/config";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { logAudit } from "@/lib/audit";
import { colorFamilyOf } from "@/lib/color";

export type BulkArtworkRow = {
  title: string;
  widthCm: number;
  heightCm: number;
  priceOriginalCents: number;
  technique: "OIL" | "ACRYLIC" | "MIXED";
  year: number | null;
  collectionId: string | null;
  dominantColor: string;
  image: { url: string; width: number; height: number };
};

/**
 * Пакетное создание работ.
 *
 * Создаём всегда черновиками: заполнен только русский, а публикация требует
 * alt-текста на трёх языках. Так владелец быстро заливает партию фотографий,
 * а переводы доводит отдельным проходом — вместо того чтобы застрять на первой
 * же работе, переключая языковые вкладки.
 */
export async function createArtworksBulk(rows: BulkArtworkRow[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = bulkArtworksSchema.safeParse(rows);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `Строка ${Number(i.path[0]) + 1}: ${i.message}`).join("; ") };
  }
  const data = parsed.data;

  // Занятые slug'и: и уже существующие в БД, и те, что генерируем прямо сейчас, —
  // иначе две одноимённые работы в одной партии столкнутся на уникальном индексе.
  const existing = await prisma.artworkTranslation.findMany({ select: { locale: true, slug: true } });
  const takenByLocale = new Map(
    LOCALES.map((l) => [
      l,
      new Set(existing.filter((e) => e.locale === toPrismaLocale(l)).map((e) => e.slug)),
    ]),
  );

  const lastPosition = (await prisma.artwork.findFirst({ orderBy: { position: "desc" } }))?.position ?? 0;

  let created = 0;

  for (const [index, row] of data.entries()) {
    const base = slugify(row.title);

    // Транзакция на работу: если упадёт перевод или картинка, не останется
    // «половинчатой» работы без переводов, которую потом руками чистить.
    await prisma.$transaction(async (tx) => {
      const artwork = await tx.artwork.create({
        data: {
          technique: row.technique,
          widthCm: row.widthCm,
          heightCm: row.heightCm,
          orientation:
            row.widthCm === row.heightCm ? "SQUARE" : row.widthCm > row.heightCm ? "LANDSCAPE" : "PORTRAIT",
          dominantColor: row.dominantColor,
          colorFamily: colorFamilyOf(row.dominantColor),
          priceOriginalCents: row.priceOriginalCents,
          year: row.year,
          collectionId: row.collectionId || null,
          position: lastPosition + index + 1,
          published: false,
          images: {
            create: {
              url: row.image.url,
              format: "webp",
              width: row.image.width,
              height: row.image.height,
              isPrimary: true,
              position: 0,
            },
          },
        },
      });

      for (const locale of LOCALES) {
        const slug = uniqueSlug(base, takenByLocale.get(locale)!);
        await tx.artworkTranslation.create({
          data: {
            artworkId: artwork.id,
            locale: toPrismaLocale(locale),
            slug,
            // Русский заполняем из формы, остальные языки оставляем пустыми:
            // копировать русский текст в EN/KO нельзя — для поисковика это
            // дубли, которые вредят обеим версиям.
            title: locale === "ru" ? row.title : "",
          },
        });
      }
    });

    created += 1;
  }

  await logAudit({
    event: "BULK_CREATE",
    severity: "info",
    actor: session.user.email ?? "",
    detail: `Создано работ: ${created}`,
  });

  revalidatePath("/admin/artworks");
  return { ok: true, created };
}
