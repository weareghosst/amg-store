import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";

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

  const db = getDb();
  const categoryList = await db
    .select()
    .from(categories)
    .orderBy(categories.position);

  const activeCategory = categoryList.find((c) => c.slug === categorySlug);

  const conditions = [eq(products.active, true)];
  if (activeCategory) {
    conditions.push(eq(products.categoryId, activeCategory.id));
  }
  if (q) {
    const query = or(
      ilike(products.name, `%${q}%`),
      ilike(products.description, `%${q}%`),
    );
    if (query) conditions.push(query);
  }

  const productList = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(60);

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
