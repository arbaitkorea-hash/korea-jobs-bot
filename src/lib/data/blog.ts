import { prisma } from "@/lib/prisma";
import { toPrismaLocale, fromPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type BlogPostView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  publishedAt: Date | null;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  canonicalUrl: string;
  slugByLocale: Partial<Record<AppLocale, string>>;
};

export async function getBlogPosts(locale: AppLocale): Promise<BlogPostView[]> {
  const target = toPrismaLocale(locale);

  const rows = await prisma.blogPost.findMany({
    where: { published: true, translations: { some: { locale: target } } },
    orderBy: { publishedAt: "desc" },
    include: { translations: true },
  });

  return rows.flatMap((p) => {
    const t = p.translations.find((tr) => tr.locale === target);
    if (!t) return [];
    const slugByLocale: Partial<Record<AppLocale, string>> = {};
    for (const tr of p.translations) slugByLocale[fromPrismaLocale(tr.locale)] = tr.slug;

    return [
      {
        id: p.id,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        contentHtml: t.contentHtml,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        keywords: t.keywords,
        canonicalUrl: t.canonicalUrl,
        slugByLocale,
      },
    ];
  });
}

export async function getBlogPostBySlug(
  locale: AppLocale,
  slug: string,
): Promise<BlogPostView | null> {
  const target = toPrismaLocale(locale);

  const post = await prisma.blogPost.findFirst({
    where: { published: true, translations: { some: { locale: target, slug } } },
    include: { translations: true },
  });
  if (!post) return null;

  const t = post.translations.find((tr) => tr.locale === target);
  if (!t) return null;

  const slugByLocale: Partial<Record<AppLocale, string>> = {};
  for (const tr of post.translations) slugByLocale[fromPrismaLocale(tr.locale)] = tr.slug;

  return {
    id: post.id,
    slug: t.slug,
    title: t.title,
    excerpt: t.excerpt,
    contentHtml: t.contentHtml,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    keywords: t.keywords,
    canonicalUrl: t.canonicalUrl,
    slugByLocale,
  };
}

export async function getBlogParams(): Promise<{ lang: AppLocale; slug: string }[]> {
  const translations = await prisma.blogPostTranslation.findMany({
    where: { blogPost: { published: true } },
    select: { locale: true, slug: true },
  });
  return translations.map((t) => ({ lang: fromPrismaLocale(t.locale), slug: t.slug }));
}

export async function getBlogSitemapEntries() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
  });
  return posts.map((p) => ({
    updatedAt: p.updatedAt,
    slugByLocale: Object.fromEntries(
      p.translations.map((t) => [fromPrismaLocale(t.locale), t.slug]),
    ) as Partial<Record<AppLocale, string>>,
  }));
}
