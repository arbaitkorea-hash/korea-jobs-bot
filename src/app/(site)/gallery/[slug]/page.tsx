import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArtworkBySlug,
  getAllPublishedSlugs,
  getRelatedArtworks,
  incrementArtworkViews,
} from "@/lib/data/artworks";
import { Container } from "@/components/ui/container";
import { ImageZoom } from "@/components/artwork/image-zoom";
import { AddToCartForm } from "@/components/artwork/add-to-cart-form";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { JsonLd } from "@/components/seo/json-ld";
import { artworkJsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork) return {};

  const title = artwork.seoTitle || siteConfig.titleTemplate.artwork(artwork.title);
  const description = artwork.seoDescription || artwork.description;
  const ogImage = artwork.ogImage || artwork.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: artwork.canonicalUrl || `/gallery/${artwork.slug}` },
    openGraph: {
      title: artwork.ogTitle || title,
      description: artwork.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      type: "website",
    },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork) notFound();

  void incrementArtworkViews(artwork.id);
  const related = await getRelatedArtworks(artwork.id, artwork.collectionId);
  const primaryImage = artwork.images[0];

  return (
    <Container className="py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Галерея", url: "/gallery" },
          { name: artwork.title, url: `/gallery/${artwork.slug}` },
        ])}
      />
      {primaryImage && (
        <>
          <JsonLd
            data={artworkJsonLd({
              slug: artwork.slug,
              title: artwork.title,
              description: artwork.seoDescription || artwork.description,
              imageUrl: primaryImage.url,
              widthCm: artwork.widthCm,
              heightCm: artwork.heightCm,
              priceCents: artwork.priceOriginalCents,
              currency: artwork.currency,
              available: artwork.status === "AVAILABLE",
            })}
          />
          <JsonLd
            data={productJsonLd({
              slug: artwork.slug,
              title: artwork.title,
              description: artwork.seoDescription || artwork.description,
              imageUrl: primaryImage.url,
              priceCents: artwork.priceOriginalCents,
              currency: artwork.currency,
              available: artwork.status === "AVAILABLE",
            })}
          />
        </>
      )}

      <nav aria-label="Хлебные крошки" className="mb-8 text-sm text-fg-muted">
        <Link href="/gallery" className="hover:text-fg">Галерея</Link> / {artwork.title}
      </nav>

      <article className="grid gap-12 lg:grid-cols-2">
        <figure>
          {primaryImage && (
            <ImageZoom
              src={primaryImage.url}
              alt={artwork.altText || artwork.title}
              width={primaryImage.width}
              height={primaryImage.height}
            />
          )}
          <figcaption className="sr-only">{artwork.altText || artwork.title}</figcaption>
        </figure>

        <div>
          {artwork.collection && (
            <Link href={`/collections/${artwork.collection.slug}`} className="text-sm uppercase tracking-wide text-fg-muted hover:text-fg">
              {artwork.collection.title}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-4xl">{artwork.title}</h1>
          <p className="mt-2 text-fg-muted">
            {artwork.year ? `${artwork.year}, ` : ""}
            {artwork.medium}, {artwork.widthCm}×{artwork.heightCm} см
          </p>

          <p className="mt-6 text-2xl">{formatPrice(artwork.priceOriginalCents, artwork.currency)}</p>

          <div className="mt-8">
            <AddToCartForm
              artworkId={artwork.id}
              slug={artwork.slug}
              title={artwork.title}
              imageUrl={primaryImage?.url ?? ""}
              currency={artwork.currency}
              priceOriginalCents={artwork.priceOriginalCents}
              pricePrintCents={artwork.pricePrintCents}
              available={artwork.status === "AVAILABLE"}
            />
          </div>

          {artwork.description && (
            <p className="mt-10 leading-relaxed text-fg-muted">{artwork.description}</p>
          )}

          {artwork.story && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-serif text-xl">История картины</h2>
              <p className="mt-4 leading-relaxed text-fg-muted">{artwork.story}</p>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-serif text-2xl">Из той же коллекции</h2>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ArtworkCard key={item.id} artwork={item} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
