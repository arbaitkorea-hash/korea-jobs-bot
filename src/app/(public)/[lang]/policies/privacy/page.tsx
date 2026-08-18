import type { Metadata } from "next";
import Link from "next/link";
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
    title: dict.policies.privacyTitle,
    description: dict.policies.privacyBody[0].slice(0, 155),
    alternates: buildAlternates(lang, "/policies/privacy"),
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl">{dict.policies.privacyTitle}</h1>
        <div className="mt-8 space-y-6 leading-[1.85] text-fg-muted">
          {dict.policies.privacyBody.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
          <p>
            <Link href={`/${lang}/contact`} className="underline underline-offset-4">
              {dict.contact.title}
            </Link>
          </p>
        </div>
      </article>
    </Container>
  );
}
