"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/admin/(dashboard)/orders/actions";

const LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  CONTACTED: "Связались",
  CONFIRMED: "Подтверждён",
  PAID: "Оплачен",
  SHIPPED: "Отправлен",
  CANCELLED: "Отменён",
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateOrderStatus(orderId, e.target.value as OrderStatus))}
      className="rounded border border-border bg-bg-elevated px-2 py-1 text-sm"
    >
      {Object.entries(LABELS).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
