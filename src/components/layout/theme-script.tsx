import Script from "next/script";

/**
 * Внешний файл (не инлайн-скрипт) — нужен, чтобы работать под строгим CSP
 * (script-src 'self') без 'unsafe-inline'/nonce. beforeInteractive гарантирует
 * выполнение до гидратации, чтобы исключить мигание темы (FOUC).
 */
export function ThemeScript() {
  // Правило eslint рассчитано на Pages Router (_document.js) и не знает про
  // App Router, где beforeInteractive в корневом layout — штатный паттерн
  // из документации Next.js.
  // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
  return <Script src="/theme-init.js" strategy="beforeInteractive" />;
}
