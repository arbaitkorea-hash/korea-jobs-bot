import { NextResponse, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { LOCALES, DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/** Пути, которые не относятся к языковым версиям сайта. */
const NON_LOCALIZED = ["/admin", "/api", "/sitemap.xml", "/robots.txt", "/icon.png", "/apple-icon.png"];

export default auth((request: NextAuthRequest) => {
  const { pathname } = request.nextUrl;

  // 1. Защита админки
  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), request);
    }
  }

  // 2. Языковой префикс для публичных страниц
  // Файл с расширением — это статика из /public (скрипт темы, og-картинка,
  // манифест). Такие адреса нельзя гнать через языковой редирект: браузер
  // получает 307 вместо файла и молча остаётся без него. Именно так однажды
  // перестал применяться скрипт темы — тема мигала при каждой загрузке.
  const isFile = /\.[a-z0-9]+$/i.test(pathname);

  const isNonLocalized =
    isFile || NON_LOCALIZED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isNonLocalized) {
    const hasLocale = LOCALES.some(
      (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    );

    if (!hasLocale) {
      const locale = detectLocale(request);
      const target = new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url);
      target.search = request.nextUrl.search;
      // 307: временный редирект. Постоянный (308) закрепил бы у поисковика
      // "/" → "/ru" даже для англоязычного посетителя, а язык мы выбираем
      // по Accept-Language и он у разных пользователей разный.
      return applySecurityHeaders(NextResponse.redirect(target, 307), request);
    }
  }

  return applySecurityHeaders(withCountryCookie(NextResponse.next(), request), request);
});

/** Кука со страной посетителя — её читает клиентский компонент цены. */
const COUNTRY_COOKIE = "jst_country";

/**
 * Страну знает только хостинг и только в момент запроса, а страницы галереи
 * закешированы и отдаются всем одинаковыми. Поэтому страну кладём в куку:
 * серверный HTML остаётся общим (и кешируемым), а цену в валюте посетителя
 * подставляет уже клиент. Кука не httpOnly намеренно — её и должен читать
 * браузерный код; ничего чувствительного в ней нет.
 */
function withCountryCookie(response: NextResponse, request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "";

  // Двухбуквенный код ISO-3166 и ничего больше: значение уходит в куку,
  // а оттуда в разметку — произвольную строку из заголовка туда пускать нельзя.
  if (/^[A-Za-z]{2}$/.test(country)) {
    response.cookies.set(COUNTRY_COOKIE, country.toUpperCase(), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

/** Выбор языка по заголовку Accept-Language с откатом на русский. */
function detectLocale(request: NextRequest): AppLocale {
  const header = request.headers.get("accept-language");
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const match = LOCALES.find((locale) => locale === base);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

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
function applySecurityHeaders(response: NextResponse, request?: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  // upgrade-insecure-requests на http://localhost ломает собственные же
  // ресурсы: браузер переписывает их на https, которого локально нет, и
  // страница молча теряет, например, скрипт темы. На боевом домене (https)
  // директива ничего не меняет, поэтому просто не выдаём её на http.
  const isPlainHttp = request?.nextUrl.protocol === "http:";

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
    ...(isPlainHttp ? [] : ["upgrade-insecure-requests"]),
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
