import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <Container className="py-24 text-center">
      <h1 className="font-serif text-3xl">{dict.checkout.successTitle}</h1>
      <p className="mt-4 text-fg-muted">{dict.checkout.successBody}</p>
      <Link href={`/${lang}/gallery`} className="mt-8 inline-block underline underline-offset-4">
        {dict.checkout.backToGallery}
      </Link>
    </Container>
  );
}
