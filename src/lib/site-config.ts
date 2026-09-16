export const siteConfig = {
  name: "JST ART",
  artistName: "Jung Sen Tek",
  artistNameKo: "정성택",
  // Канонический адрес — апекс без www. Переменную задаём и в продакшене:
  // запасное значение здесь только чтобы сборка не падала без окружения.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jungst.art").replace(/\/$/, ""),
  locale: "ru_RU",
  defaultOgImage: "/og-default.jpg",
  social: {
    instagram: "https://instagram.com/jst.art",
  },
  // Почта для покупателей. Настроена пересылкой на личный ящик художника:
  // письма сюда доходят, но ответ уйдёт с его личного адреса — отправка от
  // имени домена требует настоящего почтового ящика (см. DOMAIN.md).
  email: "info@jungst.art",
  // Код подтверждения прав на сайт в Naver Search Advisor. Пустое значение
  // безвредно; заполняется после регистрации сайта в вебмастере Naver.
  naverSiteVerification: process.env.NEXT_PUBLIC_NAVER_VERIFICATION ?? "",
} as const;
