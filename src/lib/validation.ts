import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(100),
  email: z.string().trim().email("Некорректный email").max(200),
  message: z.string().trim().min(10, "Минимум 10 символов").max(2000),
  // honeypot-поле против ботов: не отклоняем на схеме — иначе бот получает
  // 400 и по коду ответа отличает "сработавшую ловушку" от настоящей ошибки.
  // Заполненное поле проверяется в route handler'е и молча "успешно" игнорируется.
  website: z.string().max(200).optional().default(""),
});

export const orderItemSchema = z.object({
  artworkId: z.string().min(1),
  titleSnapshot: z.string().min(1),
  variant: z.enum(["ORIGINAL", "PRINT"]),
  quantity: z.number().int().min(1).max(20),
  unitPriceCents: z.number().int().min(0),
});

export const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1).max(50),
  // honeypot — см. комментарий в contactSchema.
  website: z.string().max(200).optional().default(""),
});

export const artworkAdminSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  story: z.string().trim().max(5000).optional().or(z.literal("")),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  medium: z.string().trim().max(200).optional().or(z.literal("")),
  widthCm: z.number().positive().max(1000),
  heightCm: z.number().positive().max(1000),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT", "SQUARE"]),
  dominantColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6}|)$/, "HEX-цвет, например #2B2B2C")
    .optional()
    .or(z.literal("")),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
  priceOriginalCents: z.number().int().min(0),
  pricePrintCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().trim().length(3),
  collectionId: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
  altText: z.string().trim().max(200).optional().or(z.literal("")),
  ogTitle: z.string().trim().max(70).optional().or(z.literal("")),
  ogDescription: z.string().trim().max(200).optional().or(z.literal("")),
  ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  canonicalUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const collectionAdminSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
  ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  canonicalUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const blogPostAdminSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  contentHtml: z.string().max(100_000),
  coverImage: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
  ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  canonicalUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});
