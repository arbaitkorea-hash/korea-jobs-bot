import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteExhibition } from "@/app/(admin)/admin/(dashboard)/exhibitions/actions";
import { LOCALES, toPrismaLocale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Выставки" };

export default async function AdminExhibitionsPage() {
  const exhibitions = await prisma.exhibition.findMany({
    orderBy: [{ startDate: "desc" }],
    include: { translations: true },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Выставки</h1>
        <Link href="/admin/exhibitions/new">
          <Button>Добавить выставку</Button>
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <p className="text-fg-muted">Пока нет выставок.</p>
      ) : (
        <ul className="divide-y divide-border">
          {exhibitions.map((e) => {
            const ru = e.translations.find((tr) => tr.locale === "RU");
            // Языки без перевода помечаем явно: выставка без названия просто
            // не покажется в соответствующей языковой версии сайта.
            const missing = LOCALES.filter((l) => {
              const t = e.translations.find((tr) => tr.locale === toPrismaLocale(l));
              return !t?.title.trim();
            });

            return (
              <li key={e.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/admin/exhibitions/${e.id}`} className="hover:underline">
                    {ru?.title || "(без названия)"}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
                    <span>
                      {formatDate(e.startDate, "ru")}
                      {e.endDate ? ` — ${formatDate(e.endDate, "ru")}` : ""}
                    </span>
                    {ru?.location && <span>{ru.location}</span>}
                    {missing.length > 0 && (
                      <span className="text-amber-600">
                        нет перевода: {missing.join(", ").toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <DeleteButton action={deleteExhibition.bind(null, e.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
