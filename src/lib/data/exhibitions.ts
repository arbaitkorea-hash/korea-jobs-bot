import { prisma } from "@/lib/prisma";
import { toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type ExhibitionView = {
  id: string;
  title: string;
  location: string;
  description: string;
  imageUrl: string;
  pressUrl: string;
  startDate: Date;
  endDate: Date | null;
  /** Выставка идёт прямо сейчас — на неё в списке ставим отдельный акцент. */
  current: boolean;
  upcoming: boolean;
};

/**
 * Выставки — единственная сущность без своих URL: у них нет slug'а и
 * отдельных страниц, всё живёт на одной странице списка. Поэтому здесь
 * нет ни slugByLocale, ни generateStaticParams.
 */
export async function getExhibitions(locale: AppLocale): Promise<ExhibitionView[]> {
  const target = toPrismaLocale(locale);

  const rows = await prisma.exhibition.findMany({
    where: { translations: { some: { locale: target } } },
    orderBy: [{ startDate: "desc" }, { position: "asc" }],
    include: { translations: true },
  });

  const now = new Date();

  return rows.flatMap((e) => {
    const t = e.translations.find((tr) => tr.locale === target);
    if (!t || !t.title.trim()) return [];

    const started = e.startDate <= now;
    const ended = e.endDate !== null && e.endDate < now;

    return [
      {
        id: e.id,
        title: t.title,
        location: t.location,
        description: t.description,
        imageUrl: e.imageUrl,
        pressUrl: e.pressUrl,
        startDate: e.startDate,
        endDate: e.endDate,
        current: started && !ended,
        upcoming: !started,
      },
    ];
  });
}

/** Ближайшая или текущая выставка — для блока на главной. */
export async function getFeaturedExhibition(locale: AppLocale): Promise<ExhibitionView | null> {
  const all = await getExhibitions(locale);
  return all.find((e) => e.current) ?? all.find((e) => e.upcoming) ?? all[0] ?? null;
}

/** Дата последнего изменения — ею датируем страницу выставок в sitemap. */
export async function getExhibitionsUpdatedAt(): Promise<Date | null> {
  const last = await prisma.exhibition.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } });
  return last?.updatedAt ?? null;
}
