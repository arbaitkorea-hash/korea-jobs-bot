import Link from "next/link";
import type { AppLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Обычная GET-форма без клиентского JS: фильтры попадают в URL, поэтому
 * результат можно переслать ссылкой, а поисковик — проиндексировать.
 */
export function GalleryFilters({
  locale,
  dict,
  collections,
  current,
}: {
  locale: AppLocale;
  dict: Dictionary;
  collections: { slug: string; title: string }[];
  current: Record<string, string | undefined>;
}) {
  const f = dict.gallery.filters;
  const hasFilters = Boolean(
    current.q ||
      current.collection ||
      current.technique ||
      current.orientation ||
      current.minPrice ||
      current.maxPrice ||
      current.sort,
  );

  const field = "mt-1 rounded border border-border bg-bg-elevated px-3 py-2";

  return (
    <form method="get" className="flex flex-wrap items-end gap-4 border-y border-border py-6 text-sm">
      <label className="flex flex-col">
        <span className="text-fg-muted">{f.search}</span>
        <input
          type="search"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder={f.searchPlaceholder}
          className={`${field} w-56`}
        />
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.collection}</span>
        <select name="collection" defaultValue={current.collection ?? ""} className={field}>
          <option value="">{f.all}</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.technique}</span>
        <select name="technique" defaultValue={current.technique ?? ""} className={field}>
          <option value="">{f.all}</option>
          <option value="OIL">{dict.technique.OIL}</option>
          <option value="ACRYLIC">{dict.technique.ACRYLIC}</option>
          <option value="MIXED">{dict.technique.MIXED}</option>
        </select>
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.orientation}</span>
        <select name="orientation" defaultValue={current.orientation ?? ""} className={field}>
          <option value="">{f.any}</option>
          <option value="LANDSCAPE">{f.landscape}</option>
          <option value="PORTRAIT">{f.portrait}</option>
          <option value="SQUARE">{f.square}</option>
        </select>
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.priceFrom}</span>
        <input
          type="number"
          name="minPrice"
          min={0}
          defaultValue={current.minPrice ?? ""}
          className={`${field} w-28`}
        />
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.priceTo}</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={current.maxPrice ?? ""}
          className={`${field} w-28`}
        />
      </label>

      <label className="flex flex-col">
        <span className="text-fg-muted">{f.sort}</span>
        <select name="sort" defaultValue={current.sort ?? ""} className={field}>
          <option value="">{f.sortDefault}</option>
          <option value="newest">{f.sortNewest}</option>
          <option value="price-asc">{f.sortPriceAsc}</option>
          <option value="price-desc">{f.sortPriceDesc}</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-2 text-accent-contrast hover:opacity-90"
      >
        {f.apply}
      </button>

      {hasFilters && (
        <Link
          href={`/${locale}/gallery`}
          className="px-2 py-2 text-fg-muted underline underline-offset-4 hover:text-fg"
        >
          {f.reset}
        </Link>
      )}
    </form>
  );
}
