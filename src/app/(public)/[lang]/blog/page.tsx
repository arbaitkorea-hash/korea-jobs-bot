import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBlogPosts } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";
import { buildAlternates } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.blog.title,
    description: dict.blog.subtitle,
    alternates: buildAlternates(lang, "/blog"),
  };
}

export default async function BlogPage({ params }: Props) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const posts = await getBlogPosts(lang);

  return (
    <Container className="py-16">
      <header className="max-w-2xl">
        <h1 className="font-serif text-4xl">{dict.blog.title}</h1>
        <p className="mt-4 text-fg-muted">{dict.blog.subtitle}</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 text-fg-muted">{dict.blog.empty}</p>
      ) : (
        <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id}>
              <Link href={`/${lang}/blog/${post.slug}`} className="group block">
                {post.coverImage && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                )}
                <h2 className="mt-4 font-serif text-xl leading-snug">{post.title}</h2>
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt.toISOString()}
                    className="mt-1 block text-xs text-fg-muted"
                  >
                    {formatDate(post.publishedAt, lang)}
                  </time>
                )}
                {post.excerpt && <p className="mt-2 text-sm text-fg-muted">{post.excerpt}</p>}
              </Link>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
