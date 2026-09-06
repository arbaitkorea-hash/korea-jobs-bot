/**
 * Импорт реального каталога работ (prisma/catalog.json) в базу.
 *
 * Зачем отдельно от seed.ts: seed — это демо-данные для разработки, а здесь
 * настоящие работы художника. На боевой базе нужен именно этот скрипт.
 *
 * Работы создаются черновиками и без фотографий: описания, истории и alt-тексты
 * пишет владелец, глядя на саму картину, а публикация без alt-текста на трёх
 * языках всё равно заблокирована в админке. Скрипт идемпотентен — повторный
 * запуск обновляет размеры и цены, но не плодит дубли и не трогает уже
 * загруженные фотографии и заполненные тексты.
 */
import { PrismaClient, type Locale, type Technique } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { slugify, uniqueSlug } from "../src/lib/slugify";

const prisma = new PrismaClient();

type CatalogRow = {
  file: string;
  widthCm: number;
  heightCm: number;
  technique: Technique;
  year: number;
  price: number;
  title: { ru: string; en: string; ko: string };
};

const LOCALES: Locale[] = ["RU", "EN", "KO"];
const KEY: Record<Locale, "ru" | "en" | "ko"> = { RU: "ru", EN: "en", KO: "ko" };

async function main() {
  const raw = await readFile(path.join(process.cwd(), "prisma", "catalog.json"), "utf8");
  const catalog = JSON.parse(raw) as { currency: string; artworks: CatalogRow[] };

  // Занятые slug'и — чтобы одноимённые работы не столкнулись на уникальном индексе.
  const existingSlugs = await prisma.artworkTranslation.findMany({
    select: { locale: true, slug: true },
  });
  const taken = new Map(
    LOCALES.map((l) => [l, new Set(existingSlugs.filter((e) => e.locale === l).map((e) => e.slug))]),
  );

  let created = 0;
  let updated = 0;

  for (const [index, row] of catalog.artworks.entries()) {
    const existing = await prisma.artworkTranslation.findFirst({
      where: { locale: "RU", title: row.title.ru },
      select: { artworkId: true },
    });

    const core = {
      year: row.year,
      technique: row.technique,
      widthCm: row.widthCm,
      heightCm: row.heightCm,
      orientation:
        row.widthCm === row.heightCm
          ? ("SQUARE" as const)
          : row.widthCm > row.heightCm
            ? ("LANDSCAPE" as const)
            : ("PORTRAIT" as const),
      priceOriginalCents: Math.round(row.price * 100),
      currency: catalog.currency,
      position: index,
    };

    const artwork = existing
      ? await prisma.artwork.update({ where: { id: existing.artworkId }, data: core })
      : await prisma.artwork.create({ data: { ...core, published: false } });

    if (existing) updated += 1;
    else created += 1;

    for (const locale of LOCALES) {
      const title = row.title[KEY[locale]];
      const current = await prisma.artworkTranslation.findUnique({
        where: { artworkId_locale: { artworkId: artwork.id, locale } },
      });

      if (current) {
        // Название обновляем, тексты и slug не трогаем: их мог поменять владелец,
        // а slug — это уже проиндексированный адрес страницы.
        await prisma.artworkTranslation.update({
          where: { artworkId_locale: { artworkId: artwork.id, locale } },
          data: { title },
        });
        continue;
      }

      const slug = uniqueSlug(slugify(title), taken.get(locale)!);
      await prisma.artworkTranslation.create({
        data: { artworkId: artwork.id, locale, slug, title },
      });
    }
  }

  console.log(`Каталог импортирован: создано ${created}, обновлено ${updated}.`);
  console.log("Все работы — черновики. Загрузите фотографии и заполните тексты в админке.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
