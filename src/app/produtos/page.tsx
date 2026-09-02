import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";

const DEMO_PRODUCTS: (typeof products.$inferSelect)[] = [
  {
    id: "demo-kit-limpeza",
    name: "Kit Limpeza Premium",
    slug: "kit-limpeza-premium",
    description: "Conjunto elegante para limpeza diária com fragrância suave e alta performance.",
    sku: "KIT-001",
    priceCents: 12990,
    comparePriceCents: 15990,
    stock: 18,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-dispensador",
    name: "Dispensador de Alvejante",
    slug: "dispensador-de-alvejante",
    description: "Prático, resistente e com ótimo rendimento para ambientes comerciais.",
    sku: "DISP-002",
    priceCents: 8990,
    comparePriceCents: 10990,
    stock: 12,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-luvas",
    name: "Luvas de Proteção Nitrílica",
    slug: "luvas-de-protecao-nitrilica",
    description: "Proteção confortável para uso profissional com excelente aderência.",
    sku: "EPI-003",
    priceCents: 15990,
    comparePriceCents: 18990,
    stock: 24,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1612817159899-1f62b7c4f746?auto=format&fit=crop&w=900&q=80",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-oculos",
    name: "Óculos de Segurança Premium",
    slug: "oculos-de-seguranca-premium",
    description: "Design moderno, proteção confiável e conforto ideal para o dia todo.",
    sku: "EPI-004",
    priceCents: 24990,
    comparePriceCents: 28990,
    stock: 10,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEMO_CATEGORIES: (typeof categories.$inferSelect)[] = [
  { id: "demo-cat-limpeza", name: "Limpeza & Higiene", slug: "limpeza-higiene", position: 1, createdAt: new Date() },
  { id: "demo-cat-epi", name: "EPI", slug: "epi", position: 2, createdAt: new Date() },
  { id: "demo-cat-piscina", name: "Piscina", slug: "piscina", position: 3, createdAt: new Date() },
  { id: "demo-cat-infantil", name: "Infantil", slug: "infantil", position: 4, createdAt: new Date() },
];

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

    productList = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(60);
  } catch (err) {
    console.error("[produtos] banco indisponível:", err);
  }

  const isDemo = productList.length === 0 && categoryList.length === 0;
  categoryList = categoryList.length > 0 ? categoryList : DEMO_CATEGORIES;
  productList = productList.length > 0 ? productList : DEMO_PRODUCTS;

  const activeCategory = categoryList.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeCategory ? activeCategory.name : "Todos os produtos"}
      </h1>

      {isDemo && (
        <p className="mt-1 text-sm text-slate-400">
          Visualização de demonstração — conecte o banco de dados para listar
          os produtos reais.
        </p>
      )}

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
