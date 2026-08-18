import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * not-found внутри [lang] не может прочитать параметр языка (Next рендерит его
 * вне контекста маршрута), поэтому текст даём сразу на трёх языках, а ссылку —
 * на корень: proxy сам направит посетителя на его языковую версию.
 */
export default function LocalizedNotFound() {
  return (
    <Container className="py-32 text-center">
      <h1 className="font-serif text-4xl">404</h1>
      <div className="mt-6 space-y-2 text-fg-muted">
        <p>Страница не найдена</p>
        <p>Page not found</p>
        <p>페이지를 찾을 수 없습니다</p>
      </div>
      <Link href="/" className="mt-8 inline-block underline underline-offset-4">
        JST ART
      </Link>
    </Container>
  );
}
