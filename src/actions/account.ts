"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { assertUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyAllUserSessions,
  getRequestIp,
} from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { firstZodError, passwordSchema } from "@/lib/validation/schemas";
import { onlyDigits } from "@/lib/validation/digits";
import { revalidatePath } from "next/cache";

export interface ActionState {
  error?: string;
  success?: string;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 11), {
      message: "Telefone inválido.",
    }),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const db = getDb();
  await db
    .update(users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
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

  await destroyAllUserSessions(user.id);
  await createSession(user.id);
  await audit({ userId: user.id, action: "user.change_password", ip });

  return { success: "Senha alterada. As outras sessões foram desconectadas." };
}
