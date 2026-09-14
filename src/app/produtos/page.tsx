import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import {
  combinarCategorias,
  combinarProdutos,
} from "@/data/produtos-recebidos";

export const dynamic = "force-dynamic";

export const metadata = { title: "Produtos" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const categorySlug = (params.categoria ?? "").slice(0, 80);

  let categoryList: (typeof categories.$inferSelect)[] = [];
  let productList: (typeof products.$inferSelect)[] = [];
  try {
    const db = getDb();
    categoryList = await db
      .select()
      .from(categories)
      .orderBy(categories.position);

    productList = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(200);
  } catch (err) {
    console.error("[produtos] banco indisponível:", err);
  }

  categoryList = combinarCategorias(categoryList);
  productList = combinarProdutos(productList, categoryList);

  const activeCategory = categoryList.find((c) => c.slug === categorySlug);
  const termo = q.trim().toLocaleLowerCase("pt-BR");
  productList = productList
    .filter((produto) => !activeCategory || produto.categoryId === activeCategory.id)
    .filter((produto) => {
      if (!termo) return true;
      return `${produto.name} ${produto.description} ${produto.sku ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo);
    })
    .slice(0, 60);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeCategory ? activeCategory.name : "Todos os produtos"}
      </h1>

      <form method="GET" action="/produtos" className="mt-4 flex max-w-md gap-2">
        {activeCategory && (
          <input type="hidden" name="categoria" value={activeCategory.slug} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar produtos..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
        >
          Buscar
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/produtos"
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            !activeCategory
              ? "bg-brand-blue text-white"
              : "border border-slate-300 bg-white text-slate-600 hover:border-brand-blue"
          }`}
        >
          Todos
        </Link>
        {categoryList.map((c) => (
          <Link
            key={c.id}
            href={`/produtos?categoria=${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              activeCategory?.id === c.id
                ? "bg-brand-blue text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:border-brand-blue"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {productList.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productList.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
