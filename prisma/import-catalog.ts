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
import { orientationFromSides } from "../src/lib/dimensions";
import { buildArtworkSeo } from "../src/lib/seo-copy";

const prisma = new PrismaClient();

type Localized = { ru: string; en: string; ko: string };

type CatalogRow = {
  file: string;
  widthCm: number;
  heightCm: number;
  technique: Technique;
  year: number;
  price: number;
  title: Localized;
  description?: Localized;
  altText?: Localized;
  keywords?: Localized;
  hashtags?: Localized;
};

const LOCALES: Locale[] = ["RU", "EN", "KO"];
const KEY: Record<Locale, "ru" | "en" | "ko"> = { RU: "ru", EN: "en", KO: "ko" };

/**
 * По умолчанию скрипт заполняет только пустые поля — то, что владелец написал
 * сам, трогать нельзя. Флаг --refresh-seo нужен, когда меняется сама формула
 * заголовков: тогда title и description для выдачи пересобираются у всех работ.
 */
const REFRESH_SEO = process.argv.includes("--refresh-seo");

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
      // Пока фотографии нет — ориентация из размеров; при загрузке снимка
      // она уточнится по его пропорциям (см. src/lib/dimensions.ts).
      orientation: orientationFromSides(row.widthCm, row.heightCm),
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
      const key = KEY[locale];
      const title = row.title[key];

      const description = row.description?.[key] ?? "";

      // Заголовок и описание для выдачи собирает тот же генератор, что и
      // кнопка «Собрать по работе» в админке, — чтобы у всех работ формула
      // была одна, независимо от того, откуда работа появилась.
      const generated = buildArtworkSeo(key, {
        title,
        description,
        technique: row.technique,
        widthCm: row.widthCm,
        heightCm: row.heightCm,
        year: row.year,
      });

      const texts = {
        title,
        description,
        altText: row.altText?.[key] ?? "",
        keywords: row.keywords?.[key] || generated.keywords,
        hashtags: row.hashtags?.[key] || generated.hashtags,
        seoTitle: generated.seoTitle,
        seoDescription: generated.seoDescription,
      };

      const current = await prisma.artworkTranslation.findUnique({
        where: { artworkId_locale: { artworkId: artwork.id, locale } },
      });

      if (current) {
        // Заполняем только пустые поля: то, что владелец уже написал сам,
        // трогать нельзя. Slug не меняем никогда — это адрес страницы,
        // который к тому времени уже может быть в индексе поисковика.
        const patch: Record<string, string> = {};
        for (const [field, value] of Object.entries(texts)) {
          if (!value) continue;
          const isFormulaField = field === "seoTitle" || field === "seoDescription";
          const isEmpty = !(current as unknown as Record<string, string>)[field]?.trim();
          if (isEmpty || (REFRESH_SEO && isFormulaField)) patch[field] = value;
        }
        if (Object.keys(patch).length > 0) {
          await prisma.artworkTranslation.update({
            where: { artworkId_locale: { artworkId: artwork.id, locale } },
            data: patch,
          });
        }
        continue;
      }

      const slug = uniqueSlug(slugify(title), taken.get(locale)!);
      await prisma.artworkTranslation.create({
        data: { artworkId: artwork.id, locale, slug, ...texts },
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
