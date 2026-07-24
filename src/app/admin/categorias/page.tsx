import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categorias — Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const db = getDb();
  const list = await db.select().from(categories).orderBy(categories.position);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
      <CategoryManager
        categories={list.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          position: c.position,
        }))}
      />
    </div>
  );
}
