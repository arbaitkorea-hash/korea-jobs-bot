import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LOCALES, toPrismaLocale } from "@/lib/i18n/config";

export const metadata = { title: "Обзор" };

export default async function AdminOverviewPage() {
  const [artworkCount, publishedCount, newOrders, riskyOrders, draftBlogCount, translations] =
    await Promise.all([
      prisma.artwork.count(),
      prisma.artwork.count({ where: { published: true } }),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.order.count({ where: { riskScore: { gte: 40 }, status: "NEW" } }),
      prisma.blogPost.count({ where: { published: false } }),
      prisma.artworkTranslation.findMany({
        where: { artwork: { published: true } },
        select: { locale: true, altText: true, seoTitle: true, seoDescription: true },
      }),
    ]);

  // Сколько опубликованных работ недоукомплектованы по каждому языку —
  // самый быстрый ответ на вопрос «где ещё нужно доработать SEO».
  const gaps = LOCALES.map((locale) => {
    const rows = translations.filter((t) => t.locale === toPrismaLocale(locale));
    const incomplete = rows.filter(
      (t) => !t.altText.trim() || !t.seoTitle.trim() || !t.seoDescription.trim(),
    ).length;
    return { locale, incomplete, total: rows.length };
  });

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Обзор</h1>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Card href="/admin/artworks" label="Работ всего" value={artworkCount} />
        <Card href="/admin/artworks" label="Опубликовано" value={publishedCount} />
        <Card href="/admin/orders" label="Новых заказов" value={newOrders} />
        <Card href="/admin/blog" label="Черновиков в блоге" value={draftBlogCount} />
      </div>

      {riskyOrders > 0 && (
        <p className="mt-6 rounded border border-danger/40 p-4 text-sm">
          <Link href="/admin/orders" className="underline underline-offset-4">
            {riskyOrders} новых заявок помечены как рискованные
          </Link>{" "}
          — стоит проверить перед подтверждением.
        </p>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-serif text-xl">Готовность SEO по языкам</h2>
        <ul className="divide-y divide-border text-sm">
          {gaps.map((g) => (
            <li key={g.locale} className="flex justify-between py-2">
              <span>{g.locale.toUpperCase()}</span>
              <span className={g.incomplete > 0 ? "text-danger" : "text-fg-muted"}>
                {g.incomplete > 0
                  ? `${g.incomplete} из ${g.total} требуют доработки`
                  : `все ${g.total} заполнены`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded border border-border p-6 hover:border-fg">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </Link>
  );
}
