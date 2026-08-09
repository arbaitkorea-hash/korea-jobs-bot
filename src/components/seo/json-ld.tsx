/**
 * JSON-LD генерируется на сервере из типизированных данных (не сырого HTML),
 * поэтому XSS-риска в привычном смысле нет. Экранируем "<" на всякий случай —
 * иначе строка вида "</script><script>…" в поле БД (например, в title картины)
 * могла бы преждевременно закрыть тег и внедрить произвольный скрипт.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
