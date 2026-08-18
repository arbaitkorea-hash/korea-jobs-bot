import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBlogPostBySlug, getBlogParams } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { SetAlternates } from "@/lib/i18n/alternates-context";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { buildAlternates, absoluteUrl } from "@/lib/seo";
import { formatDate, parseTags } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getBlogParams();
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) return {};

  const post = await getBlogPostBySlug(lang, slug);
  if (!post) return {};

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    ...(post.keywords ? { keywords: parseTags(post.keywords) } : {}),
    alternates: post.canonicalUrl
      ? { canonical: post.canonicalUrl }
      : buildAlternates(lang, "/blog", post.slugByLocale),
    openGraph: {
      type: "article",
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isAppLocale(lang)) notFound();

  const post = await getBlogPostBySlug(lang, slug);
  if (!post) notFound();

  const dict = await getDictionary(lang);

  // Санитизация на рендере — вторая линия защиты от XSS даже если в БД попал
  // не полностью очищенный HTML (например, при прямой правке через Prisma Studio).
  const safeHtml = DOMPurify.sanitize(post.contentHtml);

  return (
    <Container className="py-16">
      <SetAlternates sectionPath="/blog" slugByLocale={post.slugByLocale} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.blog.title, url: `/${lang}/blog` },
          { name: post.title, url: `/${lang}/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          url: `/${lang}/blog/${post.slug}`,
          title: post.title,
          description: post.seoDescription || post.excerpt,
          imageUrl: post.coverImage ? absoluteUrl(post.coverImage) : "",
          publishedAt: post.publishedAt,
          locale: lang,
        })}
      />

      <nav aria-label={dict.common.breadcrumb} className="mb-8 text-sm text-fg-muted">
        <Link href={`/${lang}/blog`} className="hover:text-fg">
          {dict.blog.title}
        </Link>{" "}
        / {post.title}
      </nav>

      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl leading-tight">{post.title}</h1>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="mt-3 block text-sm text-fg-muted"
          >
            {formatDate(post.publishedAt, lang)}
          </time>
        )}
        <div
          className="prose prose-neutral mt-10 max-w-none leading-[1.85]"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </Container>
  );
}
