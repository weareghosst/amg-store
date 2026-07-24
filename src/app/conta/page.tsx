import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { addresses, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { formatCep } from "@/lib/cep";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { ProfileForm, PasswordForm, AddressList } from "./account-forms";

export const dynamic = "force-dynamic";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requireUser();
  const db = getDb();
  const [addressList, recentOrders] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, user.id)),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Minha conta</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Últimos pedidos</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nenhum pedido ainda.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/conta/pedidos/${order.code}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 transition hover:border-brand-blue/40"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {order.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatBRL(order.totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/conta/pedidos"
            className="mt-3 inline-block text-sm font-medium text-brand-blue hover:underline"
          >
            Ver todos os pedidos →
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Meus dados</h2>
          <ProfileForm
            defaults={{
              name: user.name,
              phone: user.phone ?? "",
              cpfCnpj: user.cpfCnpj ?? "",
            }}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Endereços salvos</h2>
          <AddressList
            addresses={addressList.map((a) => ({
              id: a.id,
              label: a.label,
              summary: `${a.street}, ${a.number} — ${a.city}/${a.state} · CEP ${formatCep(a.cep)}`,
            }))}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Alterar senha</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
