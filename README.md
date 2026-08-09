# JST ART

Сайт-портфолио и интернет-магазин картин художника Jung Sen Tek. Next.js (App Router) +
TypeScript + Tailwind CSS + PostgreSQL/Prisma + NextAuth.

Дизайн-система и обоснование палитры — [`DESIGN.md`](./DESIGN.md).
Аудит безопасности — [`SECURITY.md`](./SECURITY.md).

## Структура проекта

```
src/
  app/
    (site)/            публичный сайт (общий layout с шапкой/подвалом)
      page.tsx          главная
      gallery/           галерея + страница картины [slug]
      collections/       коллекции + страница коллекции [slug]
      about/             о художнике
      blog/              блог + статья [slug]
      exhibitions/       выставки и пресса
      contact/           контакты
      cart/, checkout/   корзина и оформление заказа (localStorage-корзина)
      policies/          доставка / возврат / конфиденциальность
    admin/
      login/             страница входа (вне защищённого layout)
      (dashboard)/       вся защищённая админка (проверка сессии в layout.tsx)
        artworks/        CRUD картин + drag-and-drop порядок + SEO-редактор
        collections/     CRUD коллекций
        blog/            CRUD статей + WYSIWYG
        orders/          список заказов, смена статуса
        analytics/       просмотры / клики "Купить"
    api/
      auth/[...nextauth]/  NextAuth route handler
      orders/, contact/    приём заявок (rate limit + zod + honeypot)
      admin/upload/        загрузка изображений (sharp → WebP, только для админов)
      media/[filename]/    отдача загруженных файлов из storage/uploads
    sitemap.ts, robots.ts  динамические sitemap.xml / robots.txt
  components/
    admin/    формы и виджеты админки (SEO-панель, аплоадер, список с DnD)
    artwork/  карточка картины, зум, добавление в корзину
    layout/   шапка, подвал, переключатель темы
    seo/      JSON-LD
    ui/       Button, Container, FadeIn — базовые примитивы дизайн-системы
  lib/
    prisma.ts          синглтон Prisma Client
    validation.ts       все Zod-схемы (клиенту не доверяем)
    rate-limit.ts       in-memory rate limiter
    storage.ts          обработка/сохранение загруженных изображений
    jsonld.ts            генераторы JSON-LD (VisualArtwork/Product/Person/…)
    cart-context.tsx     корзина на клиенте (localStorage)
  auth.ts               конфигурация NextAuth (credentials + bcrypt)
  proxy.ts               защита /admin/* + security-заголовки (Next.js 16 "proxy",
                          бывший middleware.ts — теперь на Node.js runtime)
prisma/
  schema.prisma          вся схема БД (картины, коллекции, заказы, блог, SEO-поля)
  seed.ts                демо-данные + первый админ
storage/uploads/         локальное хранилище картинок для разработки (см. ниже)
```

## Локальный запуск

1. `npm install`
2. Скопировать `.env.example` → `.env`, заполнить `DATABASE_URL` (нужен PostgreSQL —
   локальный, Supabase или Neon) и `AUTH_SECRET` (`openssl rand -base64 32`).
3. `npx prisma migrate dev` — создаст таблицы.
4. `npm run db:seed` — создаст демо-картины, коллекции и первого админа
   (`admin@jst-art.example.com`, пароль — из `SEED_ADMIN_PASSWORD` в `.env`).
5. `npm run dev` — сайт на http://localhost:3000, админка — http://localhost:3000/admin/login.

## Деплой (Vercel + Supabase/Neon), простыми словами

1. **База данных.** Зарегистрироваться на [Supabase](https://supabase.com) или
   [Neon](https://neon.tech) (у обоих есть бесплатный тариф) → создать проект →
   скопировать строку подключения (Connection string, режим "pooled"/"transaction" —
   для serverless-функций Vercel это важно, иначе БД быстро упрётся в лимит
   подключений).
2. **Репозиторий.** Запушить код в GitHub (уже сделано, если вы читаете это в
   склонированном репозитории).
3. **Vercel.** Зайти на [vercel.com](https://vercel.com) → "Add New Project" →
   выбрать репозиторий → Vercel сам определит Next.js.
4. **Переменные окружения** в настройках проекта на Vercel (Settings → Environment
   Variables) — добавить те же ключи, что в `.env`:
   - `DATABASE_URL` — строка подключения из шага 1
   - `AUTH_SECRET` — сгенерировать новый, отдельный от локального (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_SITE_URL` — итоговый домен, например `https://jst-art.com`
   - `SEED_ADMIN_PASSWORD` — только для первого сида, после можно убрать
5. **Применить миграции на прод-БД** — самый простой способ: локально указать
   `DATABASE_URL` прод-базы во временной переменной окружения и выполнить:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
6. **Деплой** — Vercel задеплоит автоматически при пуше в основную ветку.
7. **HTTPS** — уже включён по умолчанию на домене `*.vercel.app`; для своего
   домена — добавить его в Vercel (Settings → Domains), сертификат Vercel
   выпускает и обновляет сам.
8. **Загрузка изображений на проде** — важно: файловая система на Vercel
   эфемерна (сбрасывается между деплоями), поэтому `storage/uploads/`
   подходит только для локальной разработки. Перед реальным продакшен-запуском
   подключите бесплатное S3-совместимое хранилище — проще всего Supabase
   Storage (он уже есть, если БД на Supabase) — и замените реализацию
   `saveImage()` в `src/lib/storage.ts` на загрузку в бакет вместо диска;
   остальной код (админка, `/api/admin/upload`) менять не нужно.

## Что дальше (не входит в MVP, но заложено в архитектуру)

- Реальная оплата — сейчас "Оформить заказ" создаёт заявку в БД, админ видит
  её в `/admin/orders` и связывается с покупателем. Интеграцию платёжного
  шлюза можно добавить в `src/app/api/orders/route.ts`, не меняя остальной код.
- Мультиязычность (EN/KO) — живого i18n-роутинга нет; когда появятся `/en` и
  `/ko`, добавить `alternates.languages` обратно в `src/app/layout.tsx`
  (там же оставлен комментарий, что и почему).
- 2FA для админки — поля `twoFactorSecret`/`twoFactorEnabled` уже есть в схеме.
