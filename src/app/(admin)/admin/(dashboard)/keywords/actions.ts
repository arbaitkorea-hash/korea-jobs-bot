"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { siteKeywordsSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type SiteKeywordsInput = Record<AppLocale, { keywords: string; hashtags: string }>;

export async function saveSiteKeywords(input: SiteKeywordsInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = siteKeywordsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  for (const locale of LOCALES) {
    const value = parsed.data[locale];
    await prisma.siteKeywords.upsert({
      where: { locale: toPrismaLocale(locale) },
      update: value,
      create: { ...value, locale: toPrismaLocale(locale) },
    });
  }

  revalidatePath("/admin/keywords");
  return { ok: true };
}
