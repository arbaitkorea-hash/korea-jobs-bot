import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site-config";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.contact.title,
    description: dict.contact.intro,
    alternates: buildAlternates(lang, "/contact"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <Container className="py-16">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <h1 className="font-serif text-4xl">{dict.contact.title}</h1>
          <p className="mt-6 max-w-md leading-relaxed text-fg-muted">{dict.contact.intro}</p>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block text-sm underline underline-offset-4"
          >
            Instagram
          </a>
        </div>
        <ContactForm locale={lang} dict={dict} />
      </div>
    </Container>
  );
}
