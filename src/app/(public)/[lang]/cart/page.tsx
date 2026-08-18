import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <CartView locale={lang} dict={dict} />;
}
