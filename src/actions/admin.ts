"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import {
  categories,
  orderItems,
  orders,
  products,
  users,
} from "@/db/schema";
import { assertAdmin } from "@/lib/auth/guards";
import { restoreOrderStock, transitionOrderStatus } from "@/lib/orders";
import { getRequestIp } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { parseReaisToCents } from "@/lib/money";
import {
  categoryFormSchema,
  firstZodError,
  productFormSchema,
} from "@/lib/validation/schemas";
import {
  saveStoreSettings,
  storeSettingsSchema,
} from "@/lib/settings";
import { normalizeCep } from "@/lib/cep";

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
    weightGrams: Number(formData.get("weightGrams") ?? 0),
    widthCm: Number(formData.get("widthCm") ?? 0),
    heightCm: Number(formData.get("heightCm") ?? 0),
    lengthCm: Number(formData.get("lengthCm") ?? 0),
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
  const referenced = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, idParsed.data))
    .limit(1);
  if (referenced.length > 0) {
    return {
      error:
        "Este produto já aparece em pedidos e não pode ser excluído. Desative-o em vez disso.",
    };
  }

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

// ---------- Pedidos ----------

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["paid", "canceled"],
  paid: ["processing", "canceled"],
  processing: ["shipped", "canceled"],
  shipped: ["delivered"],
  delivered: [],
  canceled: [],
};

const orderStatusInput = z.object({
  orderId: z.uuid(),
  status: z.enum(["paid", "processing", "shipped", "delivered", "canceled"]),
  trackingCode: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function updateOrderStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  const parsed = orderStatusInput.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    trackingCode: formData.get("trackingCode") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1);
  const order = rows[0];
  if (!order) return { error: "Pedido não encontrado." };

  // Máquina de estados aplicada no servidor — o front não decide transições.
  if (!ALLOWED_TRANSITIONS[order.status].includes(parsed.data.status)) {
    return {
      error: `Transição de "${order.status}" para "${parsed.data.status}" não permitida.`,
    };
  }

  // Transição condicional (WHERE status = status lido): se o pedido mudou em
  // paralelo (outro admin, webhook), nada é aplicado — evita, por exemplo,
  // devolver o estoque duas vezes num cancelamento concorrente.
  const moved = await db.transaction(async (tx) => {
    const ok = await transitionOrderStatus(tx, {
      orderId: order.id,
      from: order.status,
      to: parsed.data.status,
      extra: { trackingCode: parsed.data.trackingCode || order.trackingCode },
    });
    if (!ok) return false;

    // Cancelamento devolve o estoque
    if (parsed.data.status === "canceled") {
      await restoreOrderStock(tx, order.id);
    }
    return true;
  });
  if (!moved) {
    return {
      error: "O pedido mudou de status em outra sessão. Recarregue a página e tente de novo.",
    };
  }

  await audit({
    userId: admin.id,
    action: "order.status_change",
    entity: "order",
    entityId: order.id,
    detail: { from: order.status, to: parsed.data.status },
    ip: await getRequestIp(),
  });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${order.id}`);
  return { success: "Status atualizado." };
}

// ---------- Configurações ----------

export async function saveSettingsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();

  const originCep = normalizeCep(String(formData.get("originCep") ?? ""));
  if (!originCep) return { error: "CEP de origem inválido." };

  const fee = parseReaisToCents(String(formData.get("ownDeliveryFee") ?? ""));
  const freeAbove = parseReaisToCents(String(formData.get("ownDeliveryFreeAbove") ?? "0"));
  if (fee === null || freeAbove === null) return { error: "Valores monetários inválidos." };

  const parsed = storeSettingsSchema.safeParse({
    originCep,
    ownDeliveryFeeCents: fee,
    ownDeliveryFreeAboveCents: freeAbove,
    ownDeliveryDays: Number(formData.get("ownDeliveryDays") ?? 0),
    ownDeliveryScope: formData.get("ownDeliveryScope") ?? "state",
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
