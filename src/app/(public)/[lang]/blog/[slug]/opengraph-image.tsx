import { ImageResponse } from "next/og";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { artworkImageDataUri, fallbackOgResponse, ogFonts, OgFrame, OG_COLORS, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { siteConfig } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "JST ART";

/** Превью статьи: обложка фоном, поверх — заголовок и дата. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) return new Response("Not found", { status: 404 });

  const post = await getBlogPostBySlug(lang, slug);
  if (!post) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const date = post.publishedAt ? formatDate(post.publishedAt, lang) : "";

  const [cover, fonts] = await Promise.all([
    artworkImageDataUri(post.coverImage, 1200, 630),
    ogFonts(lang, `${post.title}${date}${dict.blog.title}${siteConfig.name}`),
  ]);

  if (fonts.length === 0) return fallbackOgResponse();

  return new ImageResponse(
    (
      <OgFrame>
        {cover && (
           
          <img
            src={cover}
            width={1200}
            height={630}
            alt=""
            style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.28 }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 80,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 6, color: OG_COLORS.accent }}>
            {`${dict.blog.title.toUpperCase()} · ${siteConfig.name.toUpperCase()}`}
          </div>
          <div style={{ fontSize: 64, marginTop: 28, lineHeight: 1.15, fontWeight: 700, maxWidth: 1000 }}>
            {post.title}
          </div>
          {date && <div style={{ fontSize: 24, marginTop: 24, color: OG_COLORS.muted }}>{date}</div>}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
