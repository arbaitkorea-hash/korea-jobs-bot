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

const TECHNIQUE_WORD: Record<"ru" | "en" | "ko", Record<Technique, string>> = {
  ru: { OIL: "холст, масло", ACRYLIC: "холст, акрил", MIXED: "смешанная техника" },
  en: { OIL: "oil on canvas", ACRYLIC: "acrylic on canvas", MIXED: "mixed media" },
  ko: { OIL: "캔버스에 유화", ACRYLIC: "캔버스에 아크릴", MIXED: "혼합 기법" },
};

const CM: Record<"ru" | "en" | "ko", string> = { ru: "см", en: "cm", ko: "cm" };

const SEO_TAIL: Record<"ru" | "en" | "ko", string> = {
  ru: "Оригинал художника Jung Sen Tek с доставкой.",
  en: "An original by Jung Sen Tek, shipped worldwide.",
  ko: "정성택 작가의 원화, 배송 가능합니다.",
};

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

      const texts = {
        title,
        description: row.description?.[key] ?? "",
        altText: row.altText?.[key] ?? "",
        keywords: row.keywords?.[key] ?? "",
        hashtags: row.hashtags?.[key] ?? "",
        // Заголовок и описание для поисковой выдачи собираются из фактов о
        // работе: название, техника, размер. Придумывать их отдельно смысла
        // нет — именно эти слова человек и вводит в поиск.
        seoTitle: `${title} — ${TECHNIQUE_WORD[key][row.technique]}, ${row.widthCm}×${row.heightCm} ${CM[key]} | JST ART`,
        seoDescription: `${row.description?.[key] ?? title} ${SEO_TAIL[key]}`.trim(),
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
          if (value && !(current as unknown as Record<string, string>)[field]?.trim()) {
            patch[field] = value;
          }
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
