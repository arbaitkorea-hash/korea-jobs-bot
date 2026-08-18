export const siteConfig = {
  name: "JST ART",
  artistName: "Jung Sen Tek",
  artistNameKo: "정성택",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jst-art.example.com").replace(/\/$/, ""),
  locale: "ru_RU",
  defaultOgImage: "/og-default.jpg",
  social: {
    instagram: "https://instagram.com/jst.art",
  },
  // Код подтверждения прав на сайт в Naver Search Advisor. Пустое значение
  // безвредно; заполняется после регистрации сайта в вебмастере Naver.
  naverSiteVerification: process.env.NEXT_PUBLIC_NAVER_VERIFICATION ?? "",
} as const;
