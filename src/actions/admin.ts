"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { categories, products, users } from "@/db/schema";
import { assertAdmin } from "@/lib/auth/guards";
import { getRequestIp } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { parseReaisToCents } from "@/lib/money";
import {
  categoryFormSchema,
  firstZodError,
  productFormSchema,
} from "@/lib/validation/schemas";
import { saveStoreSettings, storeSettingsSchema } from "@/lib/settings";

export interface AdminActionState {
  error?: string;
  success?: string;
}

// ---------- Produtos ----------

function parseProductForm(formData: FormData) {
  const price = parseReaisToCents(String(formData.get("price") ?? ""));
  const compareRaw = String(formData.get("comparePrice") ?? "").trim();
  const comparePrice = compareRaw === "" ? null : parseReaisToCents(compareRaw);
  return productFormSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    sku: formData.get("sku") ?? "",
    priceCents: price ?? -1,
    comparePriceCents: comparePrice,
    stock: Number(formData.get("stock") ?? -1),
    categoryId: String(formData.get("categoryId") ?? "") || null,
    imageUrl: formData.get("imageUrl") ?? "",
    active: formData.get("active") === "on",
  });
}

export async function createProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, parsed.data.slug))
    .limit(1);
  if (existing.length > 0) return { error: "Já existe um produto com este slug." };

  const [product] = await db
    .insert(products)
    .values({
      ...parsed.data,
      sku: parsed.data.sku || null,
      imageUrl: parsed.data.imageUrl || null,
    })
    .returning({ id: products.id });

  await audit({
    userId: admin.id,
    action: "product.create",
    entity: "product",
    entityId: product.id,
    detail: { name: parsed.data.name },
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { success: "Produto criado." };
}

export async function updateProductAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const idParsed = z.uuid().safeParse(formData.get("id"));
  if (!idParsed.success) return { error: "Produto inválido." };
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  const conflict = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, parsed.data.slug), ne(products.id, idParsed.data)))
    .limit(1);
  if (conflict.length > 0) return { error: "Já existe outro produto com este slug." };

  await db
    .update(products)
    .set({
      ...parsed.data,
      sku: parsed.data.sku || null,
      imageUrl: parsed.data.imageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, idParsed.data));

  await audit({
    userId: admin.id,
    action: "product.update",
    entity: "product",
    entityId: idParsed.data,
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { success: "Produto atualizado." };
}

export async function deleteProductAction(productId: string): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const idParsed = z.uuid().safeParse(productId);
  if (!idParsed.success) return { error: "Produto inválido." };

  const db = getDb();
  await db.delete(products).where(eq(products.id, idParsed.data));
  await audit({
    userId: admin.id,
    action: "product.delete",
    entity: "product",
    entityId: idParsed.data,
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { success: "Produto excluído." };
}

// ---------- Categorias ----------

export async function saveCategoryAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    position: Number(formData.get("position") ?? 0),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  const id = formData.get("id");
  if (id && typeof id === "string" && id !== "") {
    const idParsed = z.uuid().safeParse(id);
    if (!idParsed.success) return { error: "Categoria inválida." };
    await db
      .update(categories)
      .set(parsed.data)
      .where(eq(categories.id, idParsed.data));
  } else {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, parsed.data.slug))
      .limit(1);
    if (existing.length > 0) return { error: "Já existe uma categoria com este slug." };
    await db.insert(categories).values(parsed.data);
  }

  await audit({
    userId: admin.id,
    action: "category.save",
    entity: "category",
    detail: { slug: parsed.data.slug },
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  return { success: "Categoria salva." };
}

export async function deleteCategoryAction(categoryId: string): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const idParsed = z.uuid().safeParse(categoryId);
  if (!idParsed.success) return { error: "Categoria inválida." };

  const db = getDb();
  await db.delete(categories).where(eq(categories.id, idParsed.data));
  await audit({
    userId: admin.id,
    action: "category.delete",
    entity: "category",
    entityId: idParsed.data,
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/categorias");
  return { success: "Categoria excluída." };
}

// ---------- Configurações ----------

export async function saveSettingsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();

  const parsed = storeSettingsSchema.safeParse({
    storePhone: String(formData.get("storePhone") ?? "").trim(),
    storeEmail: String(formData.get("storeEmail") ?? "").trim(),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await saveStoreSettings(parsed.data);
  await audit({
    userId: admin.id,
    action: "settings.save",
    detail: parsed.data,
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/configuracoes");
  return { success: "Configurações salvas." };
}

// ---------- Usuários ----------

export async function toggleUserRoleAction(userId: string): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const idParsed = z.uuid().safeParse(userId);
  if (!idParsed.success) return { error: "Usuário inválido." };

  if (idParsed.data === admin.id) {
    return { error: "Você não pode remover seu próprio acesso de administrador." };
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, idParsed.data)).limit(1);
  const target = rows[0];
  if (!target) return { error: "Usuário não encontrado." };

  const newRole = target.role === "admin" ? "customer" : "admin";
  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, target.id));

  await audit({
    userId: admin.id,
    action: "user.role_change",
    entity: "user",
    entityId: target.id,
    detail: { from: target.role, to: newRole },
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/usuarios");
  return { success: `Papel de ${target.email} alterado para ${newRole}.` };
}
