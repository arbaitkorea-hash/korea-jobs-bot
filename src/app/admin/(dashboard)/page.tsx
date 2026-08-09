import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Обзор" };

export default async function AdminOverviewPage() {
  const [artworkCount, publishedCount, newOrders, draftBlogCount] = await Promise.all([
    prisma.artwork.count(),
    prisma.artwork.count({ where: { published: true } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.blogPost.count({ where: { published: false } }),
  ]);

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Обзор</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Card href="/admin/artworks" label="Картин всего" value={artworkCount} />
        <Card href="/admin/artworks" label="Опубликовано" value={publishedCount} />
        <Card href="/admin/orders" label="Новых заказов" value={newOrders} />
        <Card href="/admin/blog" label="Черновиков в блоге" value={draftBlogCount} />
      </div>
    </div>
  );
}

function Card({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded border border-border p-6 hover:border-fg">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </Link>
  );
}
