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

  try {
    const db = getDb();
    const [rows, whatsappPhone] = await Promise.all([
      db
        .select({ product: products, category: categories })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.slug, slug), eq(products.active, true)))
        .limit(1),
      getWhatsAppPhone(),
    ]);
    const row = rows[0];

    if (!row) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404, headers: mobilePublicHeaders },
      );
    }

    return NextResponse.json(
      {
        product: toMobileProduct(row.product),
        category: row.category ? toMobileCategory(row.category) : null,
        whatsappPhone,
      },
      { headers: mobilePublicHeaders },
    );
  } catch (error) {
    console.error(`[api/mobile/produtos/${slug}] banco indisponível:`, error);
    return NextResponse.json(
      { error: "Não foi possível carregar o produto agora." },
      { status: 503, headers: mobilePublicHeaders },
    );
  }
}
