import { ExhibitionForm } from "@/components/admin/exhibition-form";

export const metadata = { title: "Новая выставка" };

const empty = { title: "", location: "", description: "" };

export default function NewExhibitionPage() {
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Новая выставка</h1>
      <ExhibitionForm
        id={null}
        initial={{
          startDate: new Date().toISOString().slice(0, 10),
          endDate: "",
          imageUrl: "",
          pressUrl: "",
          translations: { ru: { ...empty }, en: { ...empty }, ko: { ...empty } },
        }}
      />
    </div>
  );
}
