import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Возврат",
  description: "Условия возврата картин и принтов JST ART.",
  alternates: { canonical: "/policies/returns" },
};

export default function ReturnsPolicyPage() {
  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl leading-relaxed">
        <h1 className="font-serif text-4xl">Возврат</h1>
        <div className="mt-8 space-y-6 text-fg-muted">
          <p>
            Если картина пришла повреждённой при доставке — свяжитесь с нами в течение 48
            часов с фотографиями упаковки и повреждения, мы организуем возврат или замену
            за наш счёт.
          </p>
          <p>
            Возврат оригинала по прочим причинам возможен в течение 14 дней с момента
            получения при сохранении товарного вида и упаковки — стоимость обратной
            доставки оплачивает покупатель.
          </p>
          <p>Принты, изготовленные на заказ, возврату не подлежат, кроме случаев брака печати.</p>
        </div>
      </article>
    </Container>
  );
}
