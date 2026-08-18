import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFeaturedArtworks } from "@/lib/data/artworks";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const featured = await getFeaturedArtworks(lang, 9);
  const hero = featured[0];
  const heroImage = hero?.images[0];

  return (
    <div>
      {/* 1. Hero с ключевой работой */}
      {hero && heroImage && (
        <section className="relative">
          <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
            <Image
              src={heroImage.url}
              alt={hero.altText || hero.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
          <Container className="pointer-events-none absolute inset-x-0 bottom-0 pb-14">
            <div className="pointer-events-auto max-w-2xl text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-white/75">
                {siteConfig.artistName}
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                {dict.home.storyTitle}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85">
                {dict.home.gallerySubtitle}
              </p>
              <div className="mt-8">
                <Link href={`/${lang}/gallery/${hero.slug}`}>
                  <Button
                    variant="secondary"
                    className="border-white text-white hover:bg-white hover:text-fg"
                  >
                    {dict.home.heroCta}
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 2. Сторителлинг о художнике */}
      <section id="story" className="border-b border-border">
        <Container className="py-28">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">{dict.home.storyTitle}</h2>
            <p className="mt-8 text-lg leading-[1.8] text-fg">{dict.home.storyLead}</p>
            <p className="mt-6 text-base leading-[1.9] text-fg-muted">{dict.home.storyBody}</p>
            <Link
              href={`/${lang}/about`}
              className="mt-8 inline-block text-sm underline underline-offset-4 hover:text-fg"
            >
              {dict.home.storyCta}
            </Link>
          </FadeIn>
        </Container>
      </section>

      {/* 3. Мини-презентация галереи */}
      <section id="works">
        <Container className="py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl">{dict.home.galleryTitle}</h2>
              <p className="mt-3 max-w-md text-fg-muted">{dict.home.gallerySubtitle}</p>
            </div>
            <Link
              href={`/${lang}/gallery`}
              className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
            >
              {dict.home.galleryCta}
            </Link>
          </div>

          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((artwork, i) => (
              <FadeIn key={artwork.id} delay={(i % 3) * 90}>
                <ArtworkCard artwork={artwork} locale={lang} dict={dict} />
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Оплата и доставка */}
      <section id="shipping" className="border-y border-border bg-bg-elevated/40">
        <Container className="py-24">
          <FadeIn>
            <h2 className="font-serif text-3xl sm:text-4xl">{dict.home.shippingTitle}</h2>
            <p className="mt-3 max-w-md text-fg-muted">{dict.home.shippingSubtitle}</p>

            <div className="mt-12 grid gap-10 md:grid-cols-3">
              <div>
                <h3 className="font-serif text-xl">{dict.home.shippingPaymentTitle}</h3>
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {dict.home.shippingPaymentBody}
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl">{dict.home.shippingDeliveryTitle}</h3>
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {dict.home.shippingDeliveryBody}
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl">{dict.home.shippingPackagingTitle}</h3>
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {dict.home.shippingPackagingBody}
                </p>
              </div>
            </div>

            <Link
              href={`/${lang}/shipping`}
              className="mt-10 inline-block text-sm underline underline-offset-4 hover:text-fg"
            >
              {dict.home.shippingCta}
            </Link>
          </FadeIn>
        </Container>
      </section>

      {/* 5. Контакты */}
      <section id="contact">
        <Container className="py-24">
          <div className="grid gap-14 lg:grid-cols-2">
            <FadeIn>
              <h2 className="font-serif text-3xl sm:text-4xl">{dict.home.contactTitle}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-fg-muted">
                {dict.home.contactSubtitle}
              </p>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-sm underline underline-offset-4"
              >
                Instagram
              </a>
            </FadeIn>
            <FadeIn delay={120}>
              <ContactForm locale={lang} dict={dict} />
            </FadeIn>
          </div>
        </Container>
      </section>
    </div>
  );
}
