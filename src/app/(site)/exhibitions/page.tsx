import type { Metadata } from "next";
import Image from "next/image";
import { getExhibitions } from "@/lib/data/exhibitions";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Выставки и пресса",
  description: "Персональные и групповые выставки Jung Sen Tek, публикации в прессе.",
  alternates: { canonical: "/exhibitions" },
};

export const revalidate = 3600;

export default async function ExhibitionsPage() {
  const exhibitions = await getExhibitions();

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">Выставки и пресса</h1>
      <div className="mt-12 space-y-16">
        {exhibitions.map((ex) => (
          <article key={ex.id} className="grid gap-6 sm:grid-cols-[240px_1fr]">
            {ex.imageUrl && (
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                <Image src={ex.imageUrl} alt={ex.title} fill className="object-cover" sizes="240px" />
              </div>
            )}
            <div>
              <h2 className="font-serif text-2xl">{ex.title}</h2>
              <p className="mt-1 text-sm text-fg-muted">
                {ex.location} · {ex.startDate.toLocaleDateString("ru-RU")}
                {ex.endDate ? ` — ${ex.endDate.toLocaleDateString("ru-RU")}` : ""}
              </p>
              {ex.description && <p className="mt-4 leading-relaxed text-fg-muted">{ex.description}</p>}
              {ex.pressUrl && (
                <a href={ex.pressUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4">
                  Публикация
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {exhibitions.length === 0 && <p className="mt-8 text-fg-muted">Информация о выставках скоро появится.</p>}
    </Container>
  );
}
