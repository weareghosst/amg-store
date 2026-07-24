import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Editar produto — Admin" };

function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = getDb();
  const [rows, categoryList] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db.select().from(categories).orderBy(categories.position),
  ]);
  const product = rows[0];
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Editar produto</h1>
      <ProductForm
        categories={categoryList.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku ?? "",
          price: centsToInput(product.priceCents),
          comparePrice: centsToInput(product.comparePriceCents),
          stock: product.stock,
          categoryId: product.categoryId ?? "",
          imageUrl: product.imageUrl ?? "",
          active: product.active,
          weightGrams: product.weightGrams,
          widthCm: product.widthCm,
          heightCm: product.heightCm,
          lengthCm: product.lengthCm,
        }}
      />
    </div>
  );
}
