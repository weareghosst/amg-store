import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Novo produto — Admin" };

export default async function NewProductPage() {
  await requireAdmin();

  let categoryList: (typeof categories.$inferSelect)[] = [];
  try {
    const db = getDb();
    categoryList = await db.select().from(categories).orderBy(categories.position);
  } catch (error) {
    console.warn("[admin/new-product] usando fallback:", error);
  }

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
        }}
      />
    </div>
  );
}
