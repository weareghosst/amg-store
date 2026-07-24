"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { addresses, users } from "@/db/schema";
import { assertUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyAllUserSessions,
  getRequestIp,
} from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import {
  addressSchema,
  cpfCnpjSchema,
  firstZodError,
  passwordSchema,
} from "@/lib/validation/schemas";
import { onlyDigits } from "@/lib/validation/cpf-cnpj";
import { revalidatePath } from "next/cache";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function addAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertUser();
  const parsed = addressSchema.safeParse({
    label: formData.get("label") ?? "",
    cep: formData.get("cep") ?? "",
    street: formData.get("street") ?? "",
    number: formData.get("number") ?? "",
    complement: formData.get("complement") ?? "",
    district: formData.get("district") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  const count = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, user.id));
  if (count.length >= 10) {
    return { error: "Limite de 10 endereços atingido." };
  }

  await db.insert(addresses).values({
    userId: user.id,
    label: parsed.data.label || "Principal",
    cep: parsed.data.cep,
    street: parsed.data.street,
    number: parsed.data.number,
    complement: parsed.data.complement || null,
    district: parsed.data.district,
    city: parsed.data.city,
    state: parsed.data.state,
  });
  revalidatePath("/conta");
  return { success: "Endereço salvo." };
}

export async function deleteAddressAction(addressId: string): Promise<ActionState> {
  const user = await assertUser();
  const parsed = z.uuid().safeParse(addressId);
  if (!parsed.success) return { error: "Endereço inválido." };

  const db = getDb();
  // Escopo por usuário: ninguém apaga endereço de outra conta.
  await db
    .delete(addresses)
    .where(and(eq(addresses.id, parsed.data), eq(addresses.userId, user.id)));
  revalidatePath("/conta");
  return { success: "Endereço removido." };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 11), {
      message: "Telefone inválido.",
    }),
  cpfCnpj: z.string(),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    cpfCnpj: formData.get("cpfCnpj") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  let cpfCnpj = user.cpfCnpj;
  if (parsed.data.cpfCnpj.trim() !== "") {
    const doc = cpfCnpjSchema.safeParse(parsed.data.cpfCnpj);
    if (!doc.success) return { error: "CPF/CNPJ inválido." };
    cpfCnpj = doc.data;
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      cpfCnpj,
      personType: cpfCnpj && cpfCnpj.length === 14 ? "PJ" : "PF",
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/conta");
  return { success: "Dados atualizados." };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertUser();
  const ip = await getRequestIp();
  const rl = await rateLimit({
    key: `chpass:${user.id}`,
    limit: 5,
    windowSeconds: 900,
  });
  if (!rl.allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = passwordSchema.safeParse(formData.get("newPassword"));
  if (!next.success) return { error: firstZodError(next.error) };

  const valid = await verifyPassword(current, user.passwordHash);
  if (!valid) return { error: "Senha atual incorreta." };

  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next.data), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Troca de senha revoga TODAS as sessões (inclusive de um possível invasor)
  await destroyAllUserSessions(user.id);
  await createSession(user.id);
  await audit({ userId: user.id, action: "user.change_password", ip });

  return { success: "Senha alterada. As outras sessões foram desconectadas." };
}
