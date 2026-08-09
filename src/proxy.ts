import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default auth((request: NextAuthRequest) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return applySecurityHeaders(NextResponse.next());
});

/**
 * CSP без nonce/strict-dynamic — намеренный выбор. Next.js App Router вставляет
 * инлайн-скрипты для стриминга RSC-данных (`self.__next_f.push(...)`), которым
 * нужен либо nonce (а это требует dynamic-рендеринга каждой страницы, читающей
 * headers()), либо 'unsafe-inline'. Мы выбрали 'unsafe-inline' для script-src,
 * чтобы сохранить SSG/ISR для галереи и блога (ключевое SEO-требование).
 * Остаточный риск закрыт: React экранирует весь пользовательский текст по
 * умолчанию, HTML в блоге чистится DOMPurify и на сохранении, и на рендере,
 * JSON-LD экранирует "<". См. SECURITY.md, раздел "CSP".
 */
function applySecurityHeaders(response: NextResponse) {
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${isDev ? "ws:" : ""}`,
    `upgrade-insecure-requests`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (!isDev) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
