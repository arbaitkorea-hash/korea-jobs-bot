import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Свяжитесь с JST ART: вопросы о картинах, заказ, выставки.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-16">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <h1 className="font-serif text-4xl">Контакты</h1>
          <p className="mt-6 max-w-md leading-relaxed text-fg-muted">
            Вопросы о картинах, доступности оригиналов, доставке или сотрудничестве —
            напишите нам, и мы ответим в течение 1–2 дней.
          </p>
          <div className="mt-8 space-y-2 text-sm">
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4">
              Instagram
            </a>
          </div>
        </div>
        <ContactForm />
      </div>
    </Container>
  );
}
