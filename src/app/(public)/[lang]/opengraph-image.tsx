import { ImageResponse } from "next/og";
import { isAppLocale, LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fallbackOgResponse, ogFonts, OgFrame, OG_COLORS, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "JST ART";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Обложка по умолчанию для всего языкового раздела: её наследуют страницы,
 * у которых нет собственной (о художнике, выставки, доставка, контакты).
 * Одна картинка на язык — потому что и заголовок, и подпись здесь языковые.
 */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isAppLocale(lang)) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const tagline = dict.meta.siteDescription;
  const name = lang === "ko" ? siteConfig.artistNameKo : siteConfig.artistName;

  const fonts = await ogFonts(lang, `${siteConfig.name}${name}${tagline}`);

  if (fonts.length === 0) return fallbackOgResponse();

  return new ImageResponse(
    (
      <OgFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 96px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 8, color: OG_COLORS.accent }}>
            {siteConfig.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 76, marginTop: 32, fontWeight: 700 }}>{name}</div>
          <div
            style={{
              fontSize: 30,
              marginTop: 28,
              color: OG_COLORS.muted,
              lineHeight: 1.4,
              maxWidth: 880,
            }}
          >
            {tagline}
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
