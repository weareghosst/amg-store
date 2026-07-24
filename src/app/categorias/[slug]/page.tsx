import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import { CategoryHero } from "@/components/category-hero";
import { CATEGORY_PAGES } from "@/lib/category-pages";

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
  try {
    const db = getDb();
    if (slug === "todos-produtos") {
      productList = await db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.createdAt))
        .limit(60);
    } else {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      if (category) {
        productList = await db
          .select()
          .from(products)
          .where(and(eq(products.active, true), eq(products.categoryId, category.id)))
          .orderBy(desc(products.createdAt))
          .limit(60);
      }
    }
  } catch (err) {
    console.error(`[categorias/${slug}] banco indisponível:`, err);
  }

  return (
    <div>
      <CategoryHero title={page.title} tagline={page.tagline} background={page.background} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {productList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum produto cadastrado nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
