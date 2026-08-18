import { prisma } from "@/lib/prisma";
import { SiteKeywordsForm } from "@/components/admin/site-keywords-form";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import type { SiteKeywordsInput } from "@/app/(admin)/admin/(dashboard)/keywords/actions";

export const metadata = { title: "Ключевые слова" };

export default async function AdminKeywordsPage() {
  const rows = await prisma.siteKeywords.findMany();

  const initial = Object.fromEntries(
    LOCALES.map((locale) => {
      const row = rows.find((r) => r.locale === toPrismaLocale(locale));
      return [locale, { keywords: row?.keywords ?? "", hashtags: row?.hashtags ?? "" }];
    }),
  ) as Record<AppLocale, { keywords: string; hashtags: string }>;

  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl">Ключевые слова и хэштеги</h1>
      <p className="mb-8 max-w-2xl text-sm text-fg-muted">
        Общие для сайта списки на каждый язык. Ключевые слова конкретной работы
        задаются в её карточке — здесь только то, что относится к бренду целиком.
      </p>
      <SiteKeywordsForm initial={initial as SiteKeywordsInput} />
    </div>
  );
}
