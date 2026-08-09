import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } });
  return posts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seoTitle || siteConfig.titleTemplate.blog(post.title),
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: post.canonicalUrl || `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      images: post.ogImage || post.coverImage ? [post.ogImage || post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  // Санитизация на рендере — вторая линия защиты от XSS даже если в БД попал
  // не полностью очищенный HTML (например, при прямой правке через студию).
  const safeHtml = DOMPurify.sanitize(post.contentHtml);

  return (
    <Container className="py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Блог", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl">{post.title}</h1>
        {post.publishedAt && (
          <time dateTime={post.publishedAt.toISOString()} className="mt-2 block text-sm text-fg-muted">
            {post.publishedAt.toLocaleDateString("ru-RU")}
          </time>
        )}
        <div
          className="prose prose-neutral mt-10 max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </Container>
  );
}
