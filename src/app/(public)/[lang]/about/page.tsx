import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.about.title,
    description: dict.about.body[0],
    alternates: buildAlternates(lang, "/about"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-section">
          {lang === "ko" ? siteConfig.artistNameKo : siteConfig.artistName}
        </h1>
        <p className="mt-2 text-fg-muted">{dict.about.role}</p>

        <div className="mt-10 space-y-6 leading-[1.85]">
          {dict.about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </article>
    </Container>
  );
}
