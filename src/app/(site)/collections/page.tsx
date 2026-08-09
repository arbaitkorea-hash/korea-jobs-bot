import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCollections } from "@/lib/data/collections";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "Коллекции",
  description: "Тематические коллекции картин Jung Sen Tek.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 3600;

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">Коллекции</h1>
      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        {collections.map((collection, i) => {
          const cover = collection.artworks[0]?.images[0];
          return (
            <FadeIn key={collection.id} delay={i * 80}>
              <Link href={`/collections/${collection.slug}`} className="group block">
                {cover && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                    <Image
                      src={cover.url}
                      alt={collection.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <h2 className="mt-4 font-serif text-2xl">{collection.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {collection._count.artworks} работ{collection._count.artworks === 1 ? "а" : ""}
                </p>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </Container>
  );
}
