# JST ART

Мультиязычный сайт-портфолио и интернет-магазин картин художника Jung Sen Tek.
Next.js 16 (App Router) + TypeScript + Tailwind + PostgreSQL/Prisma + NextAuth.

- Дизайн-система и три варианта палитры — [`DESIGN.md`](./DESIGN.md)
- SEO: реализация, семантическое ядро RU/EN/KO, хэштеги — [`SEO.md`](./SEO.md)
- Аудит безопасности по 15 пунктам — [`SECURITY.md`](./SECURITY.md)

## Языки

Три полноценные языковые версии с раздельными URL: `/ru`, `/en`, `/ko`.
Это не переключение текста на клиенте — у каждого языка свои адреса, свои
`slug` у работ и статей, свои meta-теги и связка через `hreflang`. Именно так
Google и Naver индексируют версии как самостоятельные страницы.

```
/ru/gallery/zakat-nad-ozerom
/en/gallery/sunset-over-the-lake
/ko/gallery/hosu-wiui-noeul     ← одна работа, три разных URL
```

Язык первого захода определяется по заголовку `Accept-Language`, дальше
переключатель в шапке сохраняет текущую страницу (на карточке работы — с
подстановкой правильного slug, а не подменой префикса).

## Структура

```
src/
  app/
    (public)/[lang]/       публичный сайт, свой root layout
      page.tsx              главная: hero → сторителлинг → работы → оплата/доставка → контакты
      gallery/              галерея (фильтры: коллекция, техника, ориентация, цена, поиск)
      gallery/[slug]/       карточка работы
      collections/          коллекции + страница коллекции
      about/ blog/ shipping/ contact/ cart/ checkout/ policies/
    (admin)/admin/         админка, свой root layout (не индексируется)
      login/
      (dashboard)/
        artworks/           CRUD работ: вкладки RU/EN/KO, SEO на каждый язык, drag-and-drop
        collections/ blog/  то же для коллекций и статей
        keywords/           семантическое ядро и хэштеги уровня сайта
        orders/             заявки со статусами и оценкой риска
        messages/           обращения с формы контактов
        analytics/          просмотры, клики, журнал безопасности
    api/                   auth, orders, contact, admin/upload, media
    sitemap.ts robots.ts   мультиязычные, с hreflang-альтернативами
  lib/
    i18n/                  локали, словари ru/en/ko, контекст альтернатив
    data/                  выборки с учётом языка (artworks, collections, blog)
    crypto.ts              AES-256-GCM для персональных данных
    fraud.ts audit.ts      антифрод и журнал безопасности
    jsonld.ts seo.ts       структурированные данные и hreflang
    validation.ts          все схемы Zod
  auth.ts                  NextAuth (credentials + bcrypt + блокировка перебора)
  proxy.ts                 языковой роутинг + защита /admin + заголовки безопасности
prisma/
  schema.prisma            переводы вынесены в таблицы *Translation
  seed.ts                  демо-данные сразу на трёх языках
```

## Локальный запуск

1. `npm install`
2. Скопировать `.env.example` → `.env` и заполнить. Обязательные переменные:
   `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`.
   Секреты генерируются командой `openssl rand -base64 32`.
3. `npx prisma migrate dev` — создаст таблицы.
4. `npm run db:seed` — демо-работы на трёх языках и первый администратор
   (`admin@jst-art.example.com`, пароль из `SEED_ADMIN_PASSWORD`).
5. `npm run dev` → http://localhost:3000 (редиректит на язык браузера),
   админка — http://localhost:3000/admin/login

## Деплой (Vercel + Supabase/Neon)

1. **База.** Создать проект в [Supabase](https://supabase.com) или
   [Neon](https://neon.tech), скопировать строку подключения. Для Vercel берите
   режим **pooled / transaction** — иначе serverless-функции упрутся в лимит
   подключений.
2. **Vercel.** Add New → Project → выбрать репозиторий и нужную ветку.
3. **Переменные окружения** в настройках проекта — те же, что в `.env`.
   `AUTH_SECRET` и `ENCRYPTION_KEY` сгенерировать **новые**, не переиспользуя
   локальные. Копию `ENCRYPTION_KEY` сохранить отдельно: без него ранее
   сохранённые заказы не расшифровать.
4. **Миграции на прод-базу** — локально, указав прод-`DATABASE_URL`:
   ```bash
   npx prisma migrate deploy
   npm run db:seed        # только при первом запуске
   ```
5. **HTTPS** включается Vercel автоматически, в том числе для своего домена.
6. **Хранилище картин.** Файловая система на Vercel эфемерна — папка
   `storage/uploads` подходит только для разработки. Перед реальным запуском
   подключите Supabase Storage (или Cloudinary) и замените реализацию
   `saveImage()` в `src/lib/storage.ts`; остальной код менять не нужно.
7. **Поисковики.** Подать `sitemap.xml` в Google Search Console и, отдельно,
   в Naver Search Advisor — Naver сам сайт не находит. Подробности в `SEO.md`.

## Команды

```bash
npm run dev         # разработка
npm run build       # прод-сборка
npm run lint        # eslint
npm run db:migrate  # prisma migrate dev
npm run db:deploy   # prisma migrate deploy (прод)
npm run db:seed     # демо-данные
npm run db:studio   # просмотр БД
```

## Что не входит в текущую версию

- **Онлайн-оплата.** «Оформить заказ» создаёт заявку, владелец видит её в
  `/admin/orders` и связывается с покупателем. Платёжный шлюз подключается в
  `src/app/api/orders/route.ts`, не затрагивая остальной код.
- **Страница выставок.** Была в первой версии; спецификация v2 переопределила
  структуру сайта без неё, поэтому раздел убран. Возвращается добавлением
  модели и страницы по образцу коллекций.
- **2FA для админки.** Поля в схеме готовы, TOTP-флоу не реализован.
- **Фильтр по цвету.** Поле `dominantColor` заполняется, в UI галереи не выведено.
