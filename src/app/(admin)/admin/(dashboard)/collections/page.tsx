import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { LocaleSeoDots } from "@/components/admin/locale-seo-dots";
import { deleteCollection } from "@/app/(admin)/admin/(dashboard)/collections/actions";
import { LOCALES, toPrismaLocale } from "@/lib/i18n/config";

export const metadata = { title: "Коллекции" };

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: {
      translations: true,
      _count: { select: { artworks: true } },
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Коллекции</h1>
        <Link href="/admin/collections/new">
          <Button>Добавить коллекцию</Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <p className="text-fg-muted">Пока нет коллекций.</p>
      ) : (
        <ul className="divide-y divide-border">
          {collections.map((c) => {
            const byLocale = Object.fromEntries(
              LOCALES.map((locale) => {
                const t = c.translations.find((tr) => tr.locale === toPrismaLocale(locale));
                return [
                  locale,
                  {
                    slug: t?.slug ?? "",
                    title: t?.title ?? "",
                    seoTitle: t?.seoTitle ?? "",
                    seoDescription: t?.seoDescription ?? "",
                  },
                ];
              }),
            );

            return (
              <li key={c.id} className="flex items-center justify-between py-4">
                <div>
                  <Link href={`/admin/collections/${c.id}`} className="hover:underline">
                    {byLocale.ru.title || "(без названия)"}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                    <span>{c._count.artworks} работ</span>
                    <LocaleSeoDots byLocale={byLocale} requireAlt={false} />
                  </div>
                </div>
                <DeleteButton action={deleteCollection.bind(null, c.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
