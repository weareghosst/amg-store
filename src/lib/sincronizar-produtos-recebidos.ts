import "server-only";

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products, settings } from "@/db/schema";
import {
  categoriasRecebidas,
  produtosRecebidos,
} from "@/data/produtos-recebidos";

const CHAVE_VERSAO = "catalogo_produtos_recebidos_versao";
const VERSAO_ATUAL = "2026-09-17-fotos-estoque-10";

export interface ResultadoSincronizacao {
  adicionados: number;
  atualizados: number;
  jaEstavaAtualizado: boolean;
}

export async function sincronizarProdutosRecebidos(): Promise<ResultadoSincronizacao> {
  const db = getDb();
  const [versaoSalva] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, CHAVE_VERSAO))
    .limit(1);

  if (versaoSalva?.value === VERSAO_ATUAL) {
    return { adicionados: 0, atualizados: 0, jaEstavaAtualizado: true };
  }

  await db
    .insert(categories)
    .values(
      categoriasRecebidas.map(({ name, slug, position }) => ({
        name,
        slug,
        position,
      })),
    )
    .onConflictDoNothing({ target: categories.slug });

  const categoryRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(inArray(categories.slug, categoriasRecebidas.map((item) => item.slug)));
  const categoryIdBySlug = new Map(
    categoryRows.map((category) => [category.slug, category.id]),
  );

  const inserted = await db
    .insert(products)
    .values(
      produtosRecebidos.map((product) => ({
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceCents: 0,
        stock: 10,
        categoryId: categoryIdBySlug.get(product.categoriaSlug) ?? null,
        imageUrl: product.imageUrl,
        active: true,
      })),
    )
    .onConflictDoNothing({ target: products.slug })
    .returning({ slug: products.slug });

  const insertedSlugs = new Set(inserted.map((product) => product.slug));
  const existingRows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      stock: products.stock,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      active: products.active,
    })
    .from(products)
    .where(inArray(products.slug, produtosRecebidos.map((item) => item.slug)));
  const existingBySlug = new Map(existingRows.map((product) => [product.slug, product]));

  let updated = 0;
  for (const product of produtosRecebidos) {
    if (insertedSlugs.has(product.slug)) continue;
    const existing = existingBySlug.get(product.slug);
    if (!existing) continue;
    const categoryId = categoryIdBySlug.get(product.categoriaSlug) ?? null;
    const needsUpdate =
      existing.name !== product.name ||
      existing.description !== product.description ||
      existing.stock !== 10 ||
      existing.categoryId !== categoryId ||
      existing.imageUrl !== product.imageUrl ||
      existing.active !== true;
    if (!needsUpdate) continue;

    await db
      .update(products)
      .set({
        name: product.name,
        description: product.description,
        stock: 10,
        categoryId,
        imageUrl: product.imageUrl,
        active: true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id));
    updated += 1;
  }

  await db
    .insert(settings)
    .values({ key: CHAVE_VERSAO, value: VERSAO_ATUAL })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: VERSAO_ATUAL, updatedAt: new Date() },
    });

  return {
    adicionados: inserted.length,
    atualizados: updated,
    jaEstavaAtualizado: false,
  };
}
