import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCollectionBySlug, getCollectionParams } from "@/lib/data/collections";
import { getGalleryArtworks } from "@/lib/data/artworks";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { SetAlternates } from "@/lib/i18n/alternates-context";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildAlternates } from "@/lib/seo";
import { parseTags } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getCollectionParams();
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) return {};

  const collection = await getCollectionBySlug(lang, slug);
  if (!collection) return {};

  return {
    title: collection.seoTitle || collection.title,
    description: collection.seoDescription || collection.description,
    ...(collection.keywords ? { keywords: parseTags(collection.keywords) } : {}),
    alternates: collection.canonicalUrl
      ? { canonical: collection.canonicalUrl }
      : buildAlternates(lang, "/collections", collection.slugByLocale),
    openGraph: collection.ogImage ? { images: [collection.ogImage] } : undefined,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) notFound();

  const collection = await getCollectionBySlug(lang, slug);
  if (!collection) notFound();

  const dict = await getDictionary(lang);
  const artworks = await getGalleryArtworks(lang, { collection: slug });

  return (
    <Container className="py-16">
      <SetAlternates sectionPath="/collections" slugByLocale={collection.slugByLocale} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.collections.title, url: `/${lang}/collections` },
          { name: collection.title, url: `/${lang}/collections/${collection.slug}` },
        ])}
      />

      <nav aria-label={dict.common.breadcrumb} className="mb-8 text-sm text-fg-muted">
        <Link href={`/${lang}/collections`} className="hover:text-fg">
          {dict.collections.title}
        </Link>{" "}
        / {collection.title}
      </nav>

      <header className="max-w-2xl">
        <h1 className="font-serif text-4xl">{collection.title}</h1>
        {collection.description && (
          <p className="mt-4 leading-relaxed text-fg-muted">{collection.description}</p>
        )}
      </header>

      <div className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, i) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            locale={lang}
            dict={dict}
            priority={i < 3}
          />
        ))}
      </div>
    </Container>
  );
}
