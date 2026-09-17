import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import { CategoryHero } from "@/components/category-hero";
import { CATEGORY_PAGES } from "@/lib/category-pages";
import {
  combinarCategorias,
  combinarProdutos,
} from "@/data/produtos-recebidos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: CATEGORY_PAGES[slug]?.title ?? "Categoria" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = CATEGORY_PAGES[slug];
  if (!page) notFound();

  let productList: (typeof products.$inferSelect)[] = [];
  let categoryList: (typeof categories.$inferSelect)[] = [];
  try {
    const db = getDb();
    [productList, categoryList] = await Promise.all([
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.createdAt))
        .limit(200),
      db.select().from(categories).orderBy(categories.position),
    ]);
  } catch (err) {
    console.error(`[categorias/${slug}] banco indisponível:`, err);
  }

  categoryList = combinarCategorias(categoryList);
  productList = combinarProdutos(productList, categoryList);

  const includedSlugs = new Set([slug, ...(page.includedCategorySlugs ?? [])]);
  const includedCategoryIds = new Set(
    categoryList
      .filter((category) => includedSlugs.has(category.slug))
      .map((category) => category.id),
  );
  const visibleProductList = (
    slug === "todos-produtos"
      ? productList
      : productList.filter((product) =>
          product.categoryId ? includedCategoryIds.has(product.categoryId) : false,
        )
  ).slice(0, 60);

  return (
    <div>
      <CategoryHero
        title={page.title}
        tagline={page.tagline}
        background={page.background}
        accent={page.accent}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {visibleProductList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum produto cadastrado nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProductList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
