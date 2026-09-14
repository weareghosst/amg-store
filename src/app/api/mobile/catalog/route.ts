import { and, desc, eq, ilike, or } from "drizzle-orm";
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

  try {
    const db = getDb();
    const categoryList = await db
      .select()
      .from(categories)
      .orderBy(categories.position, categories.name);
    const activeCategory = categoryList.find((category) => category.slug === categorySlug);

    const conditions = [eq(products.active, true)];
    if (activeCategory) conditions.push(eq(products.categoryId, activeCategory.id));
    if (query) {
      const textMatch = or(
        ilike(products.name, `%${query}%`),
        ilike(products.description, `%${query}%`),
        ilike(products.sku, `%${query}%`),
      );
      if (textMatch) conditions.push(textMatch);
    }

    const [productList, whatsappPhone] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(limit),
      getWhatsAppPhone(),
    ]);

    return NextResponse.json(
      {
        categories: categoryList.map(toMobileCategory),
        products: productList.map(toMobileProduct),
        whatsappPhone,
      },
      { headers: mobilePublicHeaders },
    );
  } catch (error) {
    console.error("[api/mobile/catalog] banco indisponível:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o catálogo agora." },
      { status: 503, headers: mobilePublicHeaders },
    );
  }
}
