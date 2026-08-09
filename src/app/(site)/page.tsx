import Image from "next/image";
import Link from "next/link";
import { getFeaturedArtworks } from "@/lib/data/artworks";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export default async function HomePage() {
  const featured = await getFeaturedArtworks(6);
  const hero = featured[0];

  return (
    <div>
      {hero?.images[0] && (
        <section className="relative">
          <div className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
            <Image
              src={hero.images[0].url}
              alt={hero.altText || hero.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          </div>
          <Container className="pointer-events-none absolute inset-x-0 bottom-0 pb-12">
            <div className="pointer-events-auto max-w-xl text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">
                {siteConfig.artistName}
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
                {hero.title}
              </h1>
              <div className="mt-6">
                <Link href={`/gallery/${hero.slug}`}>
                  <Button variant="secondary" className="border-white text-white hover:bg-white hover:text-fg">
                    Смотреть картину
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      <Container className="py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl">Философия</h2>
          <p className="mt-6 text-lg leading-8 text-fg-muted">
            {siteConfig.artistName} пишет тишину: свет на воде, пар над утренним чаем, пустой
            стул у окна. Каждая картина — это медленное наблюдение, перенесённое на холст слоями
            масла в несколько недель.
          </p>
          <Link href="/about" className="mt-6 inline-block text-sm underline underline-offset-4">
            О художнике
          </Link>
        </FadeIn>
      </Container>

      <Container className="pb-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Последние работы</h2>
          <Link href="/gallery" className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg">
            Вся галерея
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((artwork, i) => (
            <FadeIn key={artwork.id} delay={i * 80}>
              <ArtworkCard artwork={artwork} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </div>
  );
}
