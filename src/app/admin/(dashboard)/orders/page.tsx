import { prisma } from "@/lib/prisma";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Заказы" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Заказы</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-fg-muted">
            <tr>
              <th className="py-2 pr-4">Дата</th>
              <th className="py-2 pr-4">Клиент</th>
              <th className="py-2 pr-4">Контакты</th>
              <th className="py-2 pr-4">Состав</th>
              <th className="py-2 pr-4">Сумма</th>
              <th className="py-2 pr-4">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3 pr-4 align-top">{order.createdAt.toLocaleDateString("ru-RU")}</td>
                <td className="py-3 pr-4 align-top">{order.customerName}</td>
                <td className="py-3 pr-4 align-top">
                  <div>{order.email}</div>
                  {order.phone && <div className="text-fg-muted">{order.phone}</div>}
                </td>
                <td className="py-3 pr-4 align-top">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.titleSnapshot} × {item.quantity} ({item.variant === "ORIGINAL" ? "ориг." : "принт"})
                    </div>
                  ))}
                </td>
                <td className="py-3 pr-4 align-top">{formatPrice(order.totalCents, order.currency)}</td>
                <td className="py-3 pr-4 align-top">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="mt-4 text-fg-muted">Пока нет заказов.</p>}
      </div>
    </div>
  );
}
