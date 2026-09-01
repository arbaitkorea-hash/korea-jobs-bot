import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BulkUploader } from "@/components/admin/bulk-uploader";

export const metadata = { title: "Массовая загрузка" };

export default async function BulkUploadPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { translations: { where: { locale: "RU" } } },
  });

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/artworks" className="text-sm text-fg-muted hover:text-fg">
          ← Работы
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Массовая загрузка</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          Залейте сразу всю партию фотографий. Ориентация и преобладающий цвет
          определятся автоматически, адрес страницы — из названия.
        </p>
      </div>

      <BulkUploader
        collections={collections.map((c) => ({
          id: c.id,
          title: c.translations[0]?.title ?? "(без названия)",
        }))}
      />
    </div>
  );
}
