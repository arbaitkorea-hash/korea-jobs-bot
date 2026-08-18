import { prisma } from "@/lib/prisma";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { decrypt } from "@/lib/crypto";
import { formatPrice, cn } from "@/lib/utils";

export const metadata = { title: "Заказы" };

const RISK_LABEL: Record<string, string> = {
  MANY_FROM_IP: "много заявок с одного IP",
  REPEAT_FROM_IP: "повторная заявка с IP",
  MANY_FROM_EMAIL: "много заявок с одного email",
  DISPOSABLE_EMAIL: "одноразовый email",
  SUSPICIOUS_NAME: "подозрительное имя",
  HIGH_VALUE: "крупная сумма",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  // Расшифровка происходит только здесь, на сервере, под проверенной сессией.
  const rows = orders.map((o) => ({
    ...o,
    customerName: decrypt(o.customerNameEnc),
    email: decrypt(o.emailEnc),
    phone: decrypt(o.phoneEnc),
    address: decrypt(o.addressEnc),
    message: decrypt(o.messageEnc),
    flags: o.riskFlags ? o.riskFlags.split(",").filter(Boolean) : [],
  }));

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Заказы</h1>

      {rows.length === 0 ? (
        <p className="text-fg-muted">Пока нет заказов.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-fg-muted">
              <tr>
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2 pr-4">Клиент</th>
                <th className="py-2 pr-4">Контакты</th>
                <th className="py-2 pr-4">Состав</th>
                <th className="py-2 pr-4">Сумма</th>
                <th className="py-2 pr-4">Риск</th>
                <th className="py-2 pr-4">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((order) => (
                <tr key={order.id}>
                  <td className="py-3 pr-4 align-top whitespace-nowrap">
                    {order.createdAt.toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {order.customerName}
                    <div className="text-xs text-fg-muted">{order.locale}</div>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <div>{order.email}</div>
                    {order.phone && <div className="text-fg-muted">{order.phone}</div>}
                    {order.address && (
                      <div className="mt-1 max-w-xs text-xs text-fg-muted">{order.address}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.titleSnapshot} × {item.quantity}{" "}
                        <span className="text-fg-muted">
                          ({item.variant === "ORIGINAL" ? "ориг." : "принт"})
                        </span>
                      </div>
                    ))}
                    {order.message && (
                      <div className="mt-1 max-w-xs text-xs text-fg-muted">«{order.message}»</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap">
                    {formatPrice(order.totalCents, order.currency, "ru")}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {order.riskScore > 0 ? (
                      <div>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs",
                            order.riskScore >= 40
                              ? "bg-red-600/15 text-danger"
                              : "bg-amber-500/15 text-amber-700",
                          )}
                        >
                          {order.riskScore}
                        </span>
                        <ul className="mt-1 text-xs text-fg-muted">
                          {order.flags.map((f) => (
                            <li key={f}>{RISK_LABEL[f] ?? f}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
