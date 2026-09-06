import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCollections } from "@/lib/data/collections";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.collections.title,
    description: dict.collections.subtitle,
    alternates: buildAlternates(lang, "/collections"),
  };
}

export default async function CollectionsPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const collections = await getCollections(lang);

  return (
    <Container className="py-16">
      <header className="max-w-2xl">
        <h1 className="font-serif text-section">{dict.collections.title}</h1>
        <p className="mt-4 text-fg-muted">{dict.collections.subtitle}</p>
      </header>

      {collections.length === 0 ? (
        <p className="mt-12 text-fg-muted">{dict.collections.empty}</p>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          {collections.map((collection, i) => (
            <FadeIn key={collection.id} delay={(i % 2) * 90}>
              <Link href={`/${lang}/collections/${collection.slug}`} className="group block">
                {collection.coverImage && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                    <Image
                      src={collection.coverImage.url}
                      alt={collection.coverAlt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                )}
                <h2 className="mt-4 font-serif text-2xl">{collection.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {collection.artworkCount} {dict.collections.worksCount}
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </Container>
  );
}
