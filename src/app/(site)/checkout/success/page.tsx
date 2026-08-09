import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata = { title: "Заявка отправлена", robots: { index: false } };

export default function CheckoutSuccessPage() {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-serif text-3xl">Спасибо за заявку!</h1>
      <p className="mt-4 text-fg-muted">Мы свяжемся с вами в ближайшее время для подтверждения заказа.</p>
      <Link href="/gallery" className="mt-8 inline-block underline underline-offset-4">
        Вернуться в галерею
      </Link>
    </Container>
  );
}
