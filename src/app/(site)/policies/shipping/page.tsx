import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Доставка",
  description: "Условия доставки картин и принтов JST ART.",
  alternates: { canonical: "/policies/shipping" },
};

export default function ShippingPolicyPage() {
  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl leading-relaxed">
        <h1 className="font-serif text-4xl">Доставка</h1>
        <div className="mt-8 space-y-6 text-fg-muted">
          <p>
            Оригиналы картин упаковываются вручную в защитный багет и картонный короб с
            амортизацией углов. Принты отправляются в жёстком тубусе или плоском конверте
            с усиленными уголками.
          </p>
          <p>
            Сроки доставки по Корее — 2–5 рабочих дней. Международная доставка — от 7 до 21
            рабочего дня в зависимости от страны, точный срок и стоимость уточняются после
            оформления заявки.
          </p>
          <p>
            Каждая отправка сопровождается номером для отслеживания, который мы направляем
            на указанный email.
          </p>
        </div>
      </article>
    </Container>
  );
}
