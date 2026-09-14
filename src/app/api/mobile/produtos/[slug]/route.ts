import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return mobileOptionsResponse();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || slug.length > 120) {
    return NextResponse.json(
      { error: "Produto inválido." },
      { status: 400, headers: mobilePublicHeaders },
    );
  }

  let productRows: (typeof products.$inferSelect)[] = [];
  let categoryList: (typeof categories.$inferSelect)[] = [];
  try {
    const db = getDb();
    [productRows, categoryList] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.active, true)))
        .limit(1),
      db.select().from(categories).orderBy(categories.position),
    ]);
  } catch (error) {
    console.error(`[api/mobile/produtos/${slug}] banco indisponível:`, error);
  }

  const allCategories = combinarCategorias(categoryList);
  const product = combinarProdutos(productRows, allCategories).find(
    (item) => item.slug === slug,
  );

  if (!product) {
    return NextResponse.json(
      { error: "Produto não encontrado." },
      { status: 404, headers: mobilePublicHeaders },
    );
  }

  const category = product.categoryId
    ? allCategories.find((item) => item.id === product.categoryId) ?? null
    : null;

  return NextResponse.json(
    {
      product: toMobileProduct(product),
      category: category ? toMobileCategory(category) : null,
      whatsappPhone: await getWhatsAppPhone(),
    },
    { headers: mobilePublicHeaders },
  );
}
