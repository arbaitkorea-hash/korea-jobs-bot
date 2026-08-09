import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SeoHealthBadge } from "@/components/admin/seo-health-badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCollection } from "@/app/admin/(dashboard)/collections/actions";

export const metadata = { title: "Коллекции" };

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { artworks: true } } },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Коллекции</h1>
        <Link href="/admin/collections/new"><Button>Добавить коллекцию</Button></Link>
      </div>

      <ul className="divide-y divide-border">
        {collections.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-4">
            <div>
              <Link href={`/admin/collections/${c.id}`} className="hover:underline">{c.title}</Link>
              <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                <span>{c._count.artworks} картин</span>
                <SeoHealthBadge seoTitle={c.seoTitle} seoDescription={c.seoDescription} slug={c.slug} requireAlt={false} />
              </div>
            </div>
            <DeleteButton action={deleteCollection.bind(null, c.id)} />
          </li>
        ))}
      </ul>
      {collections.length === 0 && <p className="text-fg-muted">Пока нет коллекций.</p>}
    </div>
  );
}
