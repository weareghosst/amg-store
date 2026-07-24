import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";

export const metadata = { title: "Produtos — Admin" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt))
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
        >
          + Novo produto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
            {rows.map(({ product, category }) => (
              <tr key={product.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {product.name}
                  </Link>
                  {product.sku && (
                    <span className="block text-xs text-slate-400">SKU {product.sku}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{category?.name ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{formatBRL(product.priceCents)}</td>
                <td className={`px-4 py-3 font-medium ${product.stock <= 5 ? "text-red-600" : ""}`}>
                  {product.stock}
                </td>
                <td className="px-4 py-3">
                  {product.active ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      Inativo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
