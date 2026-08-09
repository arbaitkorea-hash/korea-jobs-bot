/**
 * Проверка same-origin для API-роутов, защищённых сессией (cookie), но не
 * покрытых встроенной CSRF-защитой Next.js Server Actions или NextAuth.
 * multipart/form-data — "simple request" по правилам CORS: браузер отправит
 * его кросс-доменно вместе с cookie без preflight, поэтому одного session-чека
 * недостаточно — сверяем ещё и Origin.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // прямые запросы (curl, серверные интеграции) не шлют Origin

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
