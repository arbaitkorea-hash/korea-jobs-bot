import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getArtworkBySlug,
  getPublishedArtworkParams,
  getRelatedArtworks,
  incrementArtworkViews,
} from "@/lib/data/artworks";
import { Container } from "@/components/ui/container";
import { ImageZoom } from "@/components/artwork/image-zoom";
import { AddToCartForm } from "@/components/artwork/add-to-cart-form";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { JsonLd } from "@/components/seo/json-ld";
import { SetAlternates } from "@/lib/i18n/alternates-context";
import { artworkJsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { buildAlternates } from "@/lib/seo";
import { formatPrice, parseTags } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getPublishedArtworkParams();
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) return {};

  const artwork = await getArtworkBySlug(lang, slug);
  if (!artwork) return {};

  const title = artwork.seoTitle || artwork.title;
  const description = artwork.seoDescription || artwork.description;
  const ogImage = artwork.ogImage || artwork.images[0]?.url;

  return {
    title,
    description,
    ...(artwork.keywords ? { keywords: parseTags(artwork.keywords) } : {}),
    alternates: artwork.canonicalUrl
      ? { canonical: artwork.canonicalUrl }
      : buildAlternates(lang, "/gallery", artwork.slugByLocale),
    openGraph: {
      title: artwork.ogTitle || title,
      description: artwork.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      type: "website",
    },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) notFound();

  const artwork = await getArtworkBySlug(lang, slug);
  if (!artwork) notFound();

  const dict = await getDictionary(lang);
  void incrementArtworkViews(artwork.id);

  const related = await getRelatedArtworks(lang, artwork.id, artwork.collection?.slug ?? null);
  const primaryImage = artwork.images[0];
  const url = `/${lang}/gallery/${artwork.slug}`;
  const available = artwork.status === "AVAILABLE";

  return (
    <Container className="py-16">
      <SetAlternates sectionPath="/gallery" slugByLocale={artwork.slugByLocale} />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.gallery.title, url: `/${lang}/gallery` },
          { name: artwork.title, url },
        ])}
      />
      {primaryImage && (
        <>
          <JsonLd
            data={artworkJsonLd({
              url,
              title: artwork.title,
              description: artwork.seoDescription || artwork.description,
              imageUrl: primaryImage.url,
              widthCm: artwork.widthCm,
              heightCm: artwork.heightCm,
              priceCents: artwork.priceOriginalCents,
              currency: artwork.currency,
              available,
              technique: dict.technique[artwork.technique],
              year: artwork.year,
              locale: lang,
              keywords: artwork.keywords,
            })}
          />
          <JsonLd
            data={productJsonLd({
              url,
              sku: artwork.id,
              title: artwork.title,
              description: artwork.seoDescription || artwork.description,
              imageUrl: primaryImage.url,
              priceCents: artwork.priceOriginalCents,
              currency: artwork.currency,
              available,
            })}
          />
        </>
      )}

      <nav aria-label={dict.common.breadcrumb} className="mb-8 text-sm text-fg-muted">
        <Link href={`/${lang}/gallery`} className="hover:text-fg">
          {dict.gallery.title}
        </Link>{" "}
        / {artwork.title}
      </nav>

      <article className="grid gap-12 lg:grid-cols-2">
        <figure>
          {primaryImage && (
            <ImageZoom
              src={primaryImage.url}
              alt={artwork.altText || artwork.title}
              width={primaryImage.width}
              height={primaryImage.height}
              zoomLabel={dict.common.zoomImage}
              closeLabel={dict.common.close}
            />
          )}
          <figcaption className="sr-only">{artwork.altText || artwork.title}</figcaption>
        </figure>

        <div>
          {artwork.collection && (
            <Link
              href={`/${lang}/collections/${artwork.collection.slug}`}
              className="text-xs uppercase tracking-[0.2em] text-fg-muted hover:text-fg"
            >
              {artwork.collection.title}
            </Link>
          )}
          <h1 className="mt-3 font-serif text-4xl leading-tight">{artwork.title}</h1>
          <p className="mt-3 text-fg-muted">
            {artwork.year ? `${artwork.year}, ` : ""}
            {dict.technique[artwork.technique]}, {artwork.widthCm}×{artwork.heightCm}{" "}
            {dict.artwork.cm}
          </p>

          <p className="mt-6 text-2xl">
            {formatPrice(artwork.priceOriginalCents, artwork.currency, lang)}
          </p>

          <div className="mt-8">
            <AddToCartForm
              locale={lang}
              dict={dict}
              artworkId={artwork.id}
              slug={artwork.slug}
              title={artwork.title}
              imageUrl={primaryImage?.url ?? ""}
              currency={artwork.currency}
              priceOriginalCents={artwork.priceOriginalCents}
              pricePrintCents={artwork.pricePrintCents}
              available={available}
            />
          </div>

          {artwork.description && (
            <p className="mt-10 leading-relaxed text-fg-muted">{artwork.description}</p>
          )}

          {artwork.story && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-serif text-xl">{dict.artwork.storyTitle}</h2>
              <p className="mt-4 leading-relaxed text-fg-muted">{artwork.story}</p>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-10 font-serif text-2xl">{dict.artwork.related}</h2>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ArtworkCard key={item.id} artwork={item} locale={lang} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
