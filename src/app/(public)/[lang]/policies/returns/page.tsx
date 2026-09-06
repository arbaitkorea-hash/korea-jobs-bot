import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Container } from "@/components/ui/container";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.policies.returnsTitle,
    description: dict.policies.returnsBody[0].slice(0, 155),
    alternates: buildAlternates(lang, "/policies/returns"),
  };
}

export default async function ReturnsPolicyPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-section">{dict.policies.returnsTitle}</h1>
        <div className="mt-8 space-y-6 leading-[1.85] text-fg-muted">
          {dict.policies.returnsBody.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
      </article>
    </Container>
  );
}
