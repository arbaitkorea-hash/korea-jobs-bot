import { z } from "zod";

const localeSchema = z.enum(["ru", "en", "ko"]).default("ru");

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Только латиница в нижнем регистре, цифры и дефис");

/**
 * Honeypot: не отклоняем заполненное поле на уровне схемы. Иначе бот получит 400
 * и по коду ответа поймёт, что попал в ловушку. Значение проверяется в route
 * handler'е, который отвечает "успех" и молча ничего не сохраняет.
 */
const honeypot = z.string().max(200).optional().default("");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(100),
  email: z.string().trim().email("Некорректный email").max(200),
  message: z.string().trim().min(10, "Минимум 10 символов").max(2000),
  locale: localeSchema,
  website: honeypot,
});

export const orderItemSchema = z.object({
  artworkId: z.string().min(1).max(64),
  titleSnapshot: z.string().min(1).max(300),
  variant: z.enum(["ORIGINAL", "PRINT"]),
  quantity: z.number().int().min(1).max(20),
  unitPriceCents: z.number().int().min(0),
});

export const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().default(""),
  address: z.string().trim().max(500).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  items: z.array(orderItemSchema).min(1).max(50),
  locale: localeSchema,
  website: honeypot,
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

/* ---------- Админка: мультиязычные формы ---------- */

const seoTextSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  seoTitle: z.string().trim().max(70).optional().default(""),
  seoDescription: z.string().trim().max(160).optional().default(""),
  keywords: z.string().trim().max(500).optional().default(""),
  hashtags: z.string().trim().max(500).optional().default(""),
  canonicalUrl: z.string().trim().max(500).optional().default(""),
});

export const artworkTranslationSchema = seoTextSchema.extend({
  description: z.string().trim().max(2000).optional().default(""),
  story: z.string().trim().max(5000).optional().default(""),
  altText: z.string().trim().max(200).optional().default(""),
  ogTitle: z.string().trim().max(70).optional().default(""),
  ogDescription: z.string().trim().max(200).optional().default(""),
});

export const artworkAdminSchema = z.object({
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  technique: z.enum(["OIL", "ACRYLIC", "MIXED"]),
  widthCm: z.number().positive().max(1000),
  heightCm: z.number().positive().max(1000),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT", "SQUARE"]),
  dominantColor: z
    .string()
    .trim()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "HEX-цвет, например #2B2B2C")
    .optional()
    .default(""),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
  priceOriginalCents: z.number().int().min(0),
  pricePrintCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().trim().length(3),
  collectionId: z.string().max(64).nullable().optional(),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  ogImage: z.string().trim().max(500).optional().default(""),
  translations: z.object({
    ru: artworkTranslationSchema,
    en: artworkTranslationSchema,
    ko: artworkTranslationSchema,
  }),
});

export const collectionTranslationSchema = seoTextSchema.extend({
  description: z.string().trim().max(2000).optional().default(""),
});

export const collectionAdminSchema = z.object({
  ogImage: z.string().trim().max(500).optional().default(""),
  translations: z.object({
    ru: collectionTranslationSchema,
    en: collectionTranslationSchema,
    ko: collectionTranslationSchema,
  }),
});

export const blogTranslationSchema = seoTextSchema.extend({
  excerpt: z.string().trim().max(300).optional().default(""),
  contentHtml: z.string().max(100_000).optional().default(""),
});

export const blogPostAdminSchema = z.object({
  coverImage: z.string().trim().max(500).optional().default(""),
  published: z.boolean().optional().default(false),
  translations: z.object({
    ru: blogTranslationSchema,
    en: blogTranslationSchema,
    ko: blogTranslationSchema,
  }),
});

/**
 * Пакетное создание работ. Ограничение в 60 строк — не формальность:
 * это верхняя граница объёма записи в БД за один запрос, чтобы одна вкладка
 * не могла подвесить базу длинной серией транзакций.
 */
export const bulkArtworksSchema = z
  .array(
    z.object({
      title: z.string().trim().min(1, "нужно название").max(200),
      widthCm: z.number().positive("ширина должна быть больше нуля").max(1000),
      heightCm: z.number().positive("высота должна быть больше нуля").max(1000),
      priceOriginalCents: z.number().int().min(0).max(1_000_000_000_00),
      technique: z.enum(["OIL", "ACRYLIC", "MIXED"]),
      year: z.number().int().min(1900).max(2100).nullable(),
      collectionId: z.string().max(64).nullable(),
      dominantColor: z
        .string()
        .regex(/^(#[0-9a-fA-F]{6})?$/, "цвет должен быть в формате #RRGGBB")
        .default(""),
      image: z.object({
        // Принимаем только пути, которые сами же и выдали при загрузке:
        // произвольный URL позволил бы подставить чужую картинку.
        url: z.string().regex(/^\/api\/media\/[0-9a-f-]{36}-full\.webp$/, "недопустимый путь к файлу"),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
    }),
  )
  .min(1)
  .max(60, "За один раз можно создать не больше 60 работ");

/**
 * Выставка. У неё нет slug'а и SEO-полей: все выставки живут на одной
 * странице, поэтому индексируется список, а не каждая запись отдельно.
 */
export const exhibitionTranslationSchema = z.object({
  title: z.string().trim().max(200).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
});

export const exhibitionAdminSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "дата в формате ГГГГ-ММ-ДД"),
    endDate: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "дата в формате ГГГГ-ММ-ДД")
      .optional()
      .default(""),
    // Обложка попадает в next/image, а тот для чужого домена отдаёт ошибку
    // рендера. Поэтому принимаем только путь, выданный нашим загрузчиком.
    imageUrl: z
      .string()
      .trim()
      .regex(/^(\/api\/media\/[0-9a-f-]{36}-(?:full|thumb)\.webp)?$/, "недопустимый путь к файлу")
      .optional()
      .default(""),
    // Ссылка на публикацию уходит в атрибут href, поэтому разрешаем только
    // http(s): javascript:-схема здесь превратилась бы в XSS по клику.
    pressUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https?:\/\//i.test(v), "ссылка должна начинаться с http:// или https://")
      .optional()
      .default(""),
    translations: z.object({
      ru: exhibitionTranslationSchema,
      en: exhibitionTranslationSchema,
      ko: exhibitionTranslationSchema,
    }),
  })
  .refine((v) => v.translations.ru.title.trim().length > 0, {
    message: "Нужно название хотя бы на русском",
    path: ["translations", "ru", "title"],
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: "Дата окончания раньше даты начала",
    path: ["endDate"],
  });

/**
 * Курсы валют из админки. Курс приходит строкой из поля ввода: пустое поле и
 * ноль означают «курса нет» — тогда цена показывается в исходной валюте.
 * Верхняя граница отсекает опечатку вроде лишних нулей, из-за которой картина
 * стоила бы миллиарды.
 */
export const exchangeRatesSchema = z.array(
  z.object({
    base: z.enum(["RUB", "KRW", "USD"]),
    quote: z.enum(["RUB", "KRW", "USD"]),
    rate: z
      .string()
      .trim()
      .transform((v) => (v === "" ? 0 : Number(v.replace(",", "."))))
      .refine((v) => Number.isFinite(v) && v >= 0 && v < 100_000, "курс должен быть числом от 0"),
  }),
).max(12);

export const siteKeywordsSchema = z.object({
  ru: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
  en: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
  ko: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
});
