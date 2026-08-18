import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CheckoutView } from "@/components/cart/checkout-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <CheckoutView locale={lang} dict={dict} />;
}
