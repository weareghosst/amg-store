import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categorias — Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();

  let list: (typeof categories.$inferSelect)[] = [];
  let usingFallback = false;

  try {
    const db = getDb();
    list = await db.select().from(categories).orderBy(categories.position);
  } catch (error) {
    usingFallback = true;
    console.warn("[admin/categories] usando fallback:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
      {usingFallback && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Banco ainda não conectado. As categorias aparecem em modo de visualização.
        </div>
      )}
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
