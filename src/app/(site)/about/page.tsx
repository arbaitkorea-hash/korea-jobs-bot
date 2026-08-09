import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "О художнике",
  description: `Биография и творческий путь художника ${siteConfig.artistName}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl">{siteConfig.artistName}</h1>
        <p className="mt-2 text-fg-muted">Художник, JST ART</p>

        <div className="mt-10 space-y-6 leading-relaxed">
          <p>
            Jung Sen Tek пишет маслом уже больше пятнадцати лет. Его работы — это медленное
            наблюдение за светом: побережье в тумане, чашка чая на подоконнике, пустая улица
            ранним утром.
          </p>
          <p>
            Художник родился и живёт в Корее, где ежедневно возвращается в мастерскую с видом на
            море. Каждая картина создаётся многослойно — от нескольких недель до пары месяцев —
            и проходит через десятки прописок, прежде чем свет на холсте начинает казаться
            настоящим.
          </p>
          <p>
            Персональные выставки проходили в Сеуле и Пусане; работы находятся в частных
            коллекциях в Корее, России и Европе.
          </p>
        </div>
      </article>
    </Container>
  );
}
