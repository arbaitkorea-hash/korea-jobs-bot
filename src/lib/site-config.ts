export const siteConfig = {
  name: "JST ART",
  artistName: "Jung Sen Tek",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jst-art.example.com",
  description:
    "JST ART — картины маслом и авторские принты художника Jung Sen Tek. Оригиналы и печатные версии по доступным ценам.",
  descriptionEn:
    "JST ART — original oil paintings and fine-art prints by artist Jung Sen Tek.",
  locale: "ru_RU",
  defaultOgImage: "/og-default.jpg",
  social: {
    instagram: "https://instagram.com/jst.art",
  },
  titleTemplate: {
    artwork: (title: string) => `${title} — картина маслом | JST ART`,
    collection: (title: string) => `${title} — коллекция картин | JST ART`,
    blog: (title: string) => `${title} | Блог JST ART`,
    page: (title: string) => `${title} | JST ART`,
  },
} as const;
