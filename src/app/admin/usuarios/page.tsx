import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { RoleToggle } from "./role-toggle";

export const metadata = { title: "Usuários — Admin" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  let list: (typeof users.$inferSelect)[] = [];
  let usingFallback = false;

  try {
    const db = getDb();
    list = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(500);
  } catch (error) {
    usingFallback = true;
    console.warn("[admin/users] usando fallback:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
      {usingFallback && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Banco ainda não conectado. A lista de usuários aparece em modo de visualização.
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-slate-500">{user.email}</td>
                <td className="px-4 py-3">
                  {user.role === "admin" ? (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                      Admin
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      Cliente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.id !== admin.id && <RoleToggle userId={user.id} isAdmin={user.role === "admin"} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Toda alteração de papel fica registrada no log de auditoria.
      </p>
    </div>
  );
}
