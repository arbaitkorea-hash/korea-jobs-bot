import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Аналитика" };

function titleOf(translations: { locale: string; title: string }[]) {
  return translations.find((t) => t.locale === "RU")?.title ?? translations[0]?.title ?? "—";
}

export default async function AdminAnalyticsPage() {
  const [topViewed, topClicked, totals, recentAudit] = await Promise.all([
    prisma.artwork.findMany({
      orderBy: { views: "desc" },
      take: 10,
      select: { id: true, views: true, buyClicks: true, translations: { select: { locale: true, title: true } } },
    }),
    prisma.artwork.findMany({
      orderBy: { buyClicks: "desc" },
      take: 10,
      select: { id: true, views: true, buyClicks: true, translations: { select: { locale: true, title: true } } },
    }),
    prisma.artwork.aggregate({ _sum: { views: true, buyClicks: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      where: { severity: { in: ["warning", "critical"] } },
    }),
  ]);

  const views = totals._sum.views ?? 0;
  const clicks = totals._sum.buyClicks ?? 0;
  const conversion = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Аналитика</h1>

      <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatCard label="Просмотров работ" value={views} />
        <StatCard label="Кликов «Купить»" value={clicks} />
        <StatCard label="Конверсия" value={`${conversion}%`} />
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-serif text-xl">Топ по просмотрам</h2>
          <ol className="divide-y divide-border text-sm">
            {topViewed.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 py-2">
                <span className="min-w-0 truncate">{titleOf(a.translations)}</span>
                <span className="shrink-0 text-fg-muted">{a.views}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-xl">Топ по клику «Купить»</h2>
          <ol className="divide-y divide-border text-sm">
            {topClicked.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 py-2">
                <span className="min-w-0 truncate">{titleOf(a.translations)}</span>
                <span className="shrink-0 text-fg-muted">{a.buyClicks}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-14">
        <h2 className="mb-2 font-serif text-xl">Журнал безопасности</h2>
        <p className="mb-4 text-sm text-fg-muted">
          Последние подозрительные события: неудачные входы, срабатывания лимитов,
          рискованные заявки. IP хранится в виде хеша, а не открытого адреса.
        </p>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-fg-muted">Подозрительной активности не зафиксировано.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentAudit.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    log.severity === "critical"
                      ? "bg-red-600/15 text-danger"
                      : "bg-amber-500/15 text-amber-700",
                  )}
                >
                  {log.event}
                </span>
                <span className="text-fg-muted">{log.createdAt.toLocaleString("ru-RU")}</span>
                {log.actor && <span className="text-fg-muted">{log.actor}</span>}
                <span className="text-fg-muted">{log.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-12 text-xs text-fg-muted">
        Счётчики считаются напрямую из БД, без внешних сервисов. Для более глубокой
        аналитики (источники трафика, воронки) можно бесплатно подключить Plausible
        self-hosted или Google Analytics 4 — в MVP не входит.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border p-6">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}
