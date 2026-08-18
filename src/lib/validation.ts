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

export const siteKeywordsSchema = z.object({
  ru: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
  en: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
  ko: z.object({ keywords: z.string().max(2000), hashtags: z.string().max(2000) }),
});
