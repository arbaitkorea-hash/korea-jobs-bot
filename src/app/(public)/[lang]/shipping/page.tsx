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
    title: dict.shipping.title,
    description: dict.shipping.paymentBody.slice(0, 155),
    alternates: buildAlternates(lang, "/shipping"),
  };
}

export default async function ShippingPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const sections = [
    { title: dict.shipping.paymentTitle, body: dict.shipping.paymentBody },
    { title: dict.shipping.deliveryTitle, body: dict.shipping.deliveryBody },
    { title: dict.shipping.packagingTitle, body: dict.shipping.packagingBody },
    { title: dict.shipping.trackingTitle, body: dict.shipping.trackingBody },
    { title: dict.shipping.customsTitle, body: dict.shipping.customsBody },
  ];

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-section">{dict.shipping.title}</h1>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl">{section.title}</h2>
              <p className="mt-4 leading-[1.85] text-fg-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
