import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CollectionForm } from "@/components/admin/collection-form";

export const metadata = { title: "Редактирование коллекции" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) notFound();

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{collection.title}</h1>
      <CollectionForm id={collection.id} initial={collection} />
    </div>
  );
}
