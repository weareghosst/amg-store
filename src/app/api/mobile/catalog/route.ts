import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { getWhatsAppPhone } from "@/lib/whatsapp";
import {
  mobileOptionsResponse,
  mobilePublicHeaders,
  toMobileCategory,
  toMobileProduct,
} from "@/lib/mobile-api";
import {
  combinarCategorias,
  combinarProdutos,
} from "@/data/produtos-recebidos";
import { sincronizarProdutosRecebidos } from "@/lib/sincronizar-produtos-recebidos";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return mobileOptionsResponse();
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const categorySlug =
    request.nextUrl.searchParams.get("categoria")?.trim().slice(0, 80) ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limite") ?? 60);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
    : 60;

  let categoryList: (typeof categories.$inferSelect)[] = [];
  let databaseProducts: (typeof products.$inferSelect)[] = [];
  try {
    await sincronizarProdutosRecebidos();
    const db = getDb();
    [categoryList, databaseProducts] = await Promise.all([
      db
        .select()
        .from(categories)
        .orderBy(categories.position, categories.name),
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.createdAt))
        .limit(200),
    ]);
  } catch (error) {
    console.error("[api/mobile/catalog] banco indisponível:", error);
  }

  const allCategories = combinarCategorias(categoryList);
  const activeCategory = allCategories.find(
    (category) => category.slug === categorySlug,
  );
  const normalizedQuery = query.toLocaleLowerCase("pt-BR");
  const productList = combinarProdutos(databaseProducts, allCategories)
    .filter((product) => !activeCategory || product.categoryId === activeCategory.id)
    .filter((product) => {
      if (!normalizedQuery) return true;
      return `${product.name} ${product.description} ${product.sku ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery);
    })
    .slice(0, limit);

  return NextResponse.json(
    {
      categories: allCategories.map(toMobileCategory),
      products: productList.map(toMobileProduct),
      whatsappPhone: await getWhatsAppPhone(),
    },
    { headers: mobilePublicHeaders },
  );
}
