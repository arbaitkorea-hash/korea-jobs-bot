import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteContactMessage } from "@/app/(admin)/admin/(dashboard)/messages/actions";

export const metadata = { title: "Сообщения" };

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  // Расшифровка только здесь, на сервере, под проверенной сессией.
  const rows = messages.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    locale: m.locale,
    name: decrypt(m.nameEnc),
    email: decrypt(m.emailEnc),
    message: decrypt(m.messageEnc),
  }));

  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl">Сообщения</h1>
      <p className="mb-8 max-w-2xl text-sm text-fg-muted">
        Обращения с формы контактов. Данные хранятся в БД зашифрованными и
        расшифровываются только на этой странице.
      </p>

      {rows.length === 0 ? (
        <p className="text-fg-muted">Пока нет сообщений.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="text-fg-muted underline underline-offset-4">
                    {m.email}
                  </a>
                  <span className="text-xs text-fg-muted">
                    {m.createdAt.toLocaleString("ru-RU")} · {m.locale}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-fg-muted">
                  {m.message}
                </p>
              </div>
              <DeleteButton
                action={deleteContactMessage.bind(null, m.id)}
                confirmText="Удалить сообщение без возможности восстановления?"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
