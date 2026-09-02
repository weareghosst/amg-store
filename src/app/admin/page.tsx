import Link from "next/link";
import { and, count, desc, eq, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  await requireAdmin();

  let totalProducts = 0;
  let activeProducts = 0;
  let totalCategories = 0;
  let lowStock: (typeof products.$inferSelect)[] = [];
  let recentProducts: (typeof products.$inferSelect)[] = [];
  let usingFallback = false;

  try {
    const db = getDb();

    const [totalResult, activeResult, categoriesResult, lowStockResult, recentProductsResult] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(products),
        db
          .select({ value: count() })
          .from(products)
          .where(eq(products.active, true)),
        db.select({ value: count() }).from(categories),
        db
          .select()
          .from(products)
          .where(and(eq(products.active, true), lte(products.stock, 5)))
          .limit(10),
        db.select().from(products).orderBy(desc(products.createdAt)).limit(8),
      ]);

    totalProducts = totalResult[0]?.value ?? 0;
    activeProducts = activeResult[0]?.value ?? 0;
    totalCategories = categoriesResult[0]?.value ?? 0;
    lowStock = lowStockResult;
    recentProducts = recentProductsResult;
  } catch (error) {
    usingFallback = true;
    console.warn("[admin] usando dados de fallback porque o banco não está disponível:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Visão geral</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Produtos ativos</p>
          <p className="mt-1 text-3xl font-black text-brand-blue">{activeProducts}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Categorias</p>
          <p className="mt-1 text-3xl font-black text-brand-navy">{totalCategories}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Produtos com estoque baixo</p>
          <p className="mt-1 text-3xl font-black text-red-600">{lowStock.length}</p>
          <p className="text-xs text-slate-400">
            {totalProducts} produtos no total
          </p>
        </div>
      </div>

      {usingFallback && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Banco ainda não conectado. A página do admin está abrindo em modo de visualização de desenvolvimento.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Produtos recentes</h2>
          {recentProducts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nenhum produto cadastrado ainda.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm transition hover:border-brand-blue/40"
                  >
                    <span className="line-clamp-1 font-medium">{product.name}</span>
                    <span className={product.active ? "text-slate-400" : "font-semibold text-red-500"}>
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Estoque baixo (≤ 5 unidades)</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Tudo certo por aqui. ✅</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm transition hover:border-brand-blue/40"
                  >
                    <span className="line-clamp-1">{product.name}</span>
                    <span className="shrink-0 font-bold text-red-600">
                      {product.stock} un.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
