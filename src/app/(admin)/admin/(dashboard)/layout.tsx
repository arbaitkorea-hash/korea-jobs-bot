import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware уже защищает /admin/*, но проверяем сессию и здесь —
  // серверные компоненты и server actions не должны полагаться только на middleware.
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <AdminSidebar userName={session.user.name ?? ""} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
