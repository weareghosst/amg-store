import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Novo produto — Admin" };

export default async function NewProductPage() {
  await requireAdmin();
  const db = getDb();
  const categoryList = await db.select().from(categories).orderBy(categories.position);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Novo produto</h1>
      <ProductForm
        categories={categoryList.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          name: "",
          slug: "",
          description: "",
          sku: "",
          price: "",
          comparePrice: "",
          stock: 0,
          categoryId: "",
          imageUrl: "",
          active: true,
          weightGrams: 500,
          widthCm: 15,
          heightCm: 15,
          lengthCm: 20,
        }}
      />
    </div>
  );
}
