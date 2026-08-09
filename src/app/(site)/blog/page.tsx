import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Блог",
  description: "Статьи об искусстве, технике живописи и историях картин JST ART.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl">Блог</h1>
      <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
            {post.coverImage && (
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}
            <h2 className="mt-4 font-serif text-xl">{post.title}</h2>
            {post.excerpt && <p className="mt-2 text-sm text-fg-muted">{post.excerpt}</p>}
          </Link>
        ))}
      </div>
      {posts.length === 0 && <p className="mt-8 text-fg-muted">Пока нет опубликованных статей.</p>}
    </Container>
  );
}
