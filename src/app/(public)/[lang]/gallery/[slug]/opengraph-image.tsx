import { ImageResponse } from "next/og";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getArtworkBySlug } from "@/lib/data/artworks";
import { artworkImageDataUri, fallbackOgResponse, ogFonts, OgFrame, OG_COLORS, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "JST ART";

/**
 * Превью работы для соцсетей: слева сама картина, справа название и параметры.
 * Генерируется автоматически, чтобы владельцу не нужно было рисовать карточку
 * к каждой из сотен работ — а ссылка в мессенджере всё равно выглядела как
 * оформленный анонс, а не как голый URL.
 */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) return new Response("Not found", { status: 404 });

  const artwork = await getArtworkBySlug(lang, slug);
  if (!artwork) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);

  const title = artwork.ogTitle || artwork.title;
  const size_ = `${artwork.widthCm}×${artwork.heightCm} см`;
  const meta = [dict.technique[artwork.technique], artwork.year ? String(artwork.year) : "", size_]
    .filter(Boolean)
    .join(" · ");
  const price =
    artwork.status === "AVAILABLE" && artwork.priceOriginalCents > 0
      ? formatPrice(artwork.priceOriginalCents, artwork.currency, lang)
      : artwork.status === "SOLD"
        ? dict.artwork.sold
        : artwork.status === "RESERVED"
          ? dict.artwork.reserved
          : "";

  const [picture, fonts] = await Promise.all([
    artworkImageDataUri(artwork.images[0]?.url),
    ogFonts(lang, `${title}${meta}${price}${siteConfig.name}${siteConfig.artistName}`),
  ]);

  if (fonts.length === 0) return fallbackOgResponse();

  return new ImageResponse(
    (
      <OgFrame accent={/^#[0-9A-Fa-f]{6}$/.test(artwork.dominantColor) ? artwork.dominantColor : OG_COLORS.accent}>
        {picture && (
           
          <img src={picture} width={600} height={630} style={{ objectFit: "cover" }} alt="" />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 56px",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, letterSpacing: 4, color: OG_COLORS.accent }}>
              {siteConfig.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 56, lineHeight: 1.15, marginTop: 28, fontWeight: 700 }}>
              {title}
            </div>
            <div style={{ fontSize: 26, marginTop: 20, color: OG_COLORS.muted }}>{meta}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {price && <div style={{ fontSize: 34 }}>{price}</div>}
            <div style={{ fontSize: 22, marginTop: 12, color: OG_COLORS.muted }}>
              {siteConfig.artistName}
            </div>
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
