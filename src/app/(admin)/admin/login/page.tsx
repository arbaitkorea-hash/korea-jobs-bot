import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Вход в админку", robots: { index: false } };

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

/**
 * Куда вернуть после входа. Разрешаем только внутренние пути: с внешним
 * адресом в ?callbackUrl страница входа превратилась бы в открытый редирект —
 * удобную приманку для фишинга («ссылка ведёт на настоящий домен сайта»).
 * Отдельно отсекаем "//" и "/\" — браузер трактует их как схему-относительный
 * абсолютный URL, то есть тоже уход на чужой домен.
 */
function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/admin";
  }
  return value;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl">JST ART — Админка</h1>
        <p className="mt-2 text-sm text-fg-muted">Войдите, чтобы управлять сайтом.</p>
        <div className="mt-8">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
