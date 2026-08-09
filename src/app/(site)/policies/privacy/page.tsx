import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Конфиденциальность",
  description: "Политика конфиденциальности JST ART.",
  alternates: { canonical: "/policies/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl leading-relaxed">
        <h1 className="font-serif text-4xl">Конфиденциальность</h1>
        <div className="mt-8 space-y-6 text-fg-muted">
          <p>
            {siteConfig.name} собирает только данные, необходимые для обработки заявок и
            заказов: имя, email, телефон и адрес доставки. Эти данные не передаются третьим
            лицам, кроме служб доставки — и только в объёме, необходимом для отправки заказа.
          </p>
          <p>
            Данные хранятся в защищённой базе данных и удаляются по запросу пользователя.
            Форма обратной связи и оформления заказа защищены от автоматического спама.
          </p>
          <p>
            По вопросам обработки персональных данных пишите через страницу{" "}
            <a href="/contact" className="underline underline-offset-4">контактов</a>.
          </p>
        </div>
      </article>
    </Container>
  );
}
