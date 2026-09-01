import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isAppLocale, LOCALES, type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getExhibitions, type ExhibitionView } from "@/lib/data/exhibitions";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildAlternates } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.exhibitions.title,
    description: dict.exhibitions.subtitle,
    alternates: buildAlternates(lang, "/exhibitions"),
  };
}

/** Диапазон дат одной строкой; у бессрочной выставки конца просто нет. */
function period(e: ExhibitionView, locale: AppLocale) {
  const from = formatDate(e.startDate, locale);
  return e.endDate ? `${from} — ${formatDate(e.endDate, locale)}` : from;
}

export default async function ExhibitionsPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const exhibitions = await getExhibitions(lang);

  // Событийная разметка: Google показывает такие блоки в выдаче датами,
  // а для художника это второй после работ повод попасть в rich results.
  const eventsLd = exhibitions.map((e) => ({
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    name: e.title,
    startDate: e.startDate.toISOString().slice(0, 10),
    ...(e.endDate ? { endDate: e.endDate.toISOString().slice(0, 10) } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(e.location ? { location: { "@type": "Place", name: e.location } } : {}),
    ...(e.description ? { description: e.description } : {}),
    ...(e.imageUrl ? { image: `${siteConfig.url}${e.imageUrl}` } : {}),
    performer: { "@type": "Person", name: "Jung Sen Tek" },
    organizer: { "@type": "Person", name: "Jung Sen Tek" },
  }));

  return (
    <Container className="py-16">
      {eventsLd.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}

      <header className="max-w-2xl">
        <h1 className="font-serif text-4xl">{dict.exhibitions.title}</h1>
        <p className="mt-4 text-fg-muted">{dict.exhibitions.subtitle}</p>
      </header>

      {exhibitions.length === 0 ? (
        <p className="mt-12 text-fg-muted">{dict.exhibitions.empty}</p>
      ) : (
        <ol className="mt-14 space-y-14">
          {exhibitions.map((e) => (
            <li
              key={e.id}
              className="grid gap-6 border-t border-border pt-10 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-10"
            >
              {e.imageUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                  <Image
                    src={e.imageUrl}
                    alt={e.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 18rem"
                  />
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <time dateTime={e.startDate.toISOString()} className="text-sm text-fg-muted">
                    {period(e, lang)}
                  </time>
                  {e.current && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs text-accent-contrast">
                      {dict.exhibitions.now}
                    </span>
                  )}
                  {e.upcoming && (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-fg-muted">
                      {dict.exhibitions.upcoming}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 font-serif text-2xl leading-snug">{e.title}</h2>
                {e.location && <p className="mt-1 text-sm text-fg-muted">{e.location}</p>}
                {e.description && <p className="mt-4 max-w-2xl text-fg-muted">{e.description}</p>}

                {e.pressUrl && (
                  <a
                    href={e.pressUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-block text-sm underline underline-offset-4 hover:text-accent"
                  >
                    {dict.exhibitions.press}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
