/**
 * Обычная GET-форма без клиентского JS: работает как прогрессивное улучшение,
 * фильтры — часть URL, поэтому результат индексируется и доступен по прямой ссылке.
 */
export function GalleryFilters({
  collections,
}: {
  collections: { slug: string; title: string }[];
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-4 border-y border-border py-6 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-fg-muted">Коллекция</span>
        <select name="collection" defaultValue="" className="rounded border border-border bg-bg-elevated px-3 py-2">
          <option value="">Все</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-fg-muted">Ориентация</span>
        <select name="orientation" defaultValue="" className="rounded border border-border bg-bg-elevated px-3 py-2">
          <option value="">Любая</option>
          <option value="LANDSCAPE">Горизонтальная</option>
          <option value="PORTRAIT">Вертикальная</option>
          <option value="SQUARE">Квадрат</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-fg-muted">Цена от</span>
        <input
          type="number"
          name="minPrice"
          min={0}
          className="w-28 rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-fg-muted">Цена до</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          className="w-28 rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-fg-muted">Сортировка</span>
        <select name="sort" defaultValue="" className="rounded border border-border bg-bg-elevated px-3 py-2">
          <option value="">По умолчанию</option>
          <option value="newest">Сначала новые</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-2 text-accent-contrast hover:opacity-90"
      >
        Применить
      </button>
    </form>
  );
}
