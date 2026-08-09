import { prisma } from "@/lib/prisma";

export const metadata = { title: "Аналитика" };

export default async function AdminAnalyticsPage() {
  const [topViewed, topClicked, totals] = await Promise.all([
    prisma.artwork.findMany({ orderBy: { views: "desc" }, take: 10, select: { id: true, title: true, views: true, buyClicks: true } }),
    prisma.artwork.findMany({ orderBy: { buyClicks: "desc" }, take: 10, select: { id: true, title: true, views: true, buyClicks: true } }),
    prisma.artwork.aggregate({ _sum: { views: true, buyClicks: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Аналитика</h1>

      <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatCard label="Всего просмотров" value={totals._sum.views ?? 0} />
        <StatCard label="Всего кликов «Купить»" value={totals._sum.buyClicks ?? 0} />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-serif text-xl">Топ по просмотрам</h2>
          <ol className="divide-y divide-border text-sm">
            {topViewed.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>{a.title}</span>
                <span className="text-fg-muted">{a.views}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-xl">Топ по клику «Купить»</h2>
          <ol className="divide-y divide-border text-sm">
            {topClicked.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>{a.title}</span>
                <span className="text-fg-muted">{a.buyClicks}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="mt-10 text-xs text-fg-muted">
        Данные считаются напрямую из БД без внешних сервисов аналитики. Для более глубокой
        аналитики (источники трафика, воронки) можно бесплатно подключить Plausible
        self-hosted или Google Analytics 4 — интеграция не входит в MVP.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border p-6">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}
