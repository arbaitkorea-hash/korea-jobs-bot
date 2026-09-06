import type { AppLocale } from "@/lib/i18n/config";

/**
 * Сборка SEO-текстов работы: meta title, description, ключевые слова, хэштеги.
 *
 * Почему по формуле, а не «как напишется». Запросы, по которым покупают
 * живопись, устроены одинаково во всех трёх странах: сюжет + техника + размер
 * + слово намерения («купить», «for sale», «판매»). Формула гарантирует, что
 * все четыре элемента окажутся в заголовке у каждой из полусотни работ, —
 * вручную такую дисциплину не удержать.
 *
 * Что в формуле откуда:
 *  - название работы — то, что человек запомнил и ищет по памяти;
 *  - техника и размер — фильтры, по которым выбирают под интерьер;
 *  - слово намерения — отделяет коммерческий запрос от информационного;
 *  - первая фраза описания — «хук», ради которого кликают, а не пролистывают;
 *  - «единственный экземпляр» — главный аргумент оригинала против принта;
 *  - доставка — снимает возражение «это же в другой стране».
 */

export type Technique = "OIL" | "ACRYLIC" | "MIXED";
export type Status = "AVAILABLE" | "RESERVED" | "SOLD";

export type SeoCopyInput = {
  title: string;
  description?: string;
  technique: Technique;
  widthCm: number;
  heightCm: number;
  year?: number | null;
  status?: Status;
};

const MAX_TITLE = 70;
const MAX_DESCRIPTION = 160;

/** Название техники так, как его вводят в поиск, а не как в интерфейсе. */
const TECHNIQUE: Record<AppLocale, Record<Technique, string>> = {
  ru: { OIL: "картину маслом", ACRYLIC: "картину акрилом", MIXED: "картину" },
  en: { OIL: "oil painting", ACRYLIC: "acrylic painting", MIXED: "painting" },
  ko: { OIL: "유화", ACRYLIC: "아크릴화", MIXED: "회화" },
};

/** Та же техника в именительном падеже — для описания. */
const TECHNIQUE_NOUN: Record<AppLocale, Record<Technique, string>> = {
  ru: { OIL: "холст, масло", ACRYLIC: "холст, акрил", MIXED: "смешанная техника" },
  en: { OIL: "oil on canvas", ACRYLIC: "acrylic on canvas", MIXED: "mixed media" },
  ko: { OIL: "캔버스에 유화", ACRYLIC: "캔버스에 아크릴", MIXED: "혼합 기법" },
};

const BRAND = "JST ART";

/**
 * Обрезка по границе слова. Обрывать описание на середине слова нельзя:
 * поисковик покажет огрызок прямо в выдаче, и это выглядит как небрежность.
 */
function trimTo(text: string, limit: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:—-]$/, "")}…`;
}

/** Первая фраза описания — она и работает хуком в выдаче. */
function hookFrom(description: string | undefined): string {
  if (!description) return "";
  const sentence = description.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  return sentence.replace(/\s+/g, " ").trim();
}

export function buildSeoTitle(locale: AppLocale, input: SeoCopyInput): string {
  const size = `${input.widthCm}×${input.heightCm}`;
  const technique = TECHNIQUE[locale][input.technique];

  const full =
    locale === "ru"
      ? `${input.title} — купить ${technique} ${size} см | ${BRAND}`
      : locale === "en"
        ? `${input.title} — original ${technique} for sale, ${size} cm | ${BRAND}`
        : `${input.title} — ${technique} 원화 ${size}cm 판매 | ${BRAND}`;

  if (full.length <= MAX_TITLE) return full;

  // Не влезло — жертвуем словом намерения, но не названием и не размером:
  // по ним работу находят, а «купить» подхватится из описания.
  const short =
    locale === "ru"
      ? `${input.title} — ${technique} ${size} см | ${BRAND}`
      : locale === "en"
        ? `${input.title} — ${technique}, ${size} cm | ${BRAND}`
        : `${input.title} — ${technique} ${size}cm | ${BRAND}`;

  return short.length <= MAX_TITLE ? short : trimTo(short, MAX_TITLE);
}

export function buildSeoDescription(locale: AppLocale, input: SeoCopyInput): string {
  const size = `${input.widthCm}×${input.heightCm}`;
  const noun = TECHNIQUE_NOUN[locale][input.technique];
  const hook = hookFrom(input.description);
  const sold = input.status === "SOLD";

  const facts: Record<AppLocale, string> = {
    ru: `Оригинал ${size} см, ${noun} — единственный экземпляр.`,
    en: `Original ${noun}, ${size} cm — one of a kind.`,
    ko: `${noun} ${size}cm 원화, 단 한 점뿐입니다.`,
  };

  // Призыв к действию честный: у проданной работы «купить» не предлагаем.
  const cta: Record<AppLocale, string> = sold
    ? {
        ru: "Работа продана — напишите, если нужна похожая.",
        en: "This one is sold — write to us for a similar piece.",
        ko: "이 작품은 판매되었습니다 — 비슷한 작품을 문의해 주세요.",
      }
    : {
        ru: "Купить с доставкой из Кореи по всему миру.",
        en: "Buy with worldwide shipping from Korea.",
        ko: "한국에서 전 세계 배송 가능합니다.",
      };

  const tail = `${facts[locale]} ${cta[locale]}`.trim();

  // Хук ставим первым — он решает, кликнут по сниппету или нет. Место под
  // факты и призыв резервируем заранее, обрезаем именно хук.
  if (!hook) return trimTo(tail, MAX_DESCRIPTION);

  const room = MAX_DESCRIPTION - tail.length - 1;
  const head = room > 40 ? trimTo(hook, room) : "";

  return head ? `${head} ${tail}` : trimTo(tail, MAX_DESCRIPTION);
}

/**
 * Базовые ключевые слова, если художник не задал свои. Это не «ядро» работы,
 * а её коммерческий минимум: запросы, по которым ищут покупку такой картины.
 */
export function buildKeywords(locale: AppLocale, input: SeoCopyInput): string {
  const size = `${input.widthCm}×${input.heightCm}`;
  const technique = TECHNIQUE[locale][input.technique];

  if (locale === "ru") {
    return [
      `купить ${technique}`,
      `${input.title.toLowerCase()} картина`,
      `картина на холсте ${size}`,
      "оригинал картины",
      "интерьерная картина",
    ].join(", ");
  }

  if (locale === "en") {
    return [
      `${technique} for sale`,
      `${input.title.toLowerCase()} painting`,
      `canvas art ${size} cm`,
      "original painting",
      "art for interior",
    ].join(", ");
  }

  return [
    `${technique} 판매`,
    `${input.title} 그림`,
    `캔버스 그림 ${size}`,
    "원화 구매",
    "인테리어 그림",
  ].join(", ");
}

export function buildHashtags(locale: AppLocale, input: SeoCopyInput): string {
  const byTechnique: Record<AppLocale, Record<Technique, string>> = {
    ru: { OIL: "маслонахолсте", ACRYLIC: "акрилнахолсте", MIXED: "живопись" },
    en: { OIL: "oilpainting", ACRYLIC: "acrylicpainting", MIXED: "painting" },
    ko: { OIL: "유화", ACRYLIC: "아크릴화", MIXED: "회화" },
  };

  const common: Record<AppLocale, string[]> = {
    ru: ["живопись", "картинавинтерьере", "оригинал", "искусство"],
    en: ["originalart", "artforsale", "interiorart", "fineart"],
    ko: ["그림스타그램", "원화판매", "인테리어그림", "미술"],
  };

  return [byTechnique[locale][input.technique], ...common[locale]].join(", ");
}

/** Всё сразу — то, что подставляет кнопка «Собрать по работе» в админке. */
export function buildArtworkSeo(locale: AppLocale, input: SeoCopyInput) {
  return {
    seoTitle: buildSeoTitle(locale, input),
    seoDescription: buildSeoDescription(locale, input),
    keywords: buildKeywords(locale, input),
    hashtags: buildHashtags(locale, input),
  };
}
