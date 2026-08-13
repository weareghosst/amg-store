"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull, lt } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { getDb } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyAllUserSessions,
  getRequestIp,
} from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import {
  firstZodError,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";

export interface ResetRequestState {
  error?: string;
  success?: string;
}

const RESET_TOKEN_TTL_MS = 1000 * 60 * 15; // 15 minutos

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Pedido de redefinição de senha.
 *
 * Anti-enumeration: retorna sempre a mesma mensagem de sucesso, mesmo se o
 * e-mail não existir. Assim não revelamos quem tem conta.
 *
 * Anti-abuso: rate-limited por IP (3/15min) e por e-mail-alvo (3/15min) —
 * bloqueia quem tenta descobrir contas bruteforcing o "recuperar senha".
 *
 * Em desenvolvimento (sem RESEND_API_KEY) o link é logado no console em vez
 * de enviado — explicado no próprio helper sendPasswordResetEmail.
 */
export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const ip = await getRequestIp();

  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const email = parsed.data.email;

  // Rate limit Doppio segurança: IP e e-mail-alvo. Ocorrências em e-mail
  // inexistente também contam pro rate-limit (IP) para evitar descoberta ráida.
  const [rlIp, rlEmail] = await Promise.all([
    rateLimit({ key: `resetreq:ip:${ip}`, limit: 3, windowSeconds: 900 }),
    rateLimit({ key: `resetreq:email:${email}`, limit: 3, windowSeconds: 900 }),
  ]);
  if (!rlIp.allowed || !rlEmail.allowed) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];

  if (user) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);

    // Limpa tokens expirados do mesmo usuário para não acumular ruído.
    await db
      .delete(passwordResets)
      .where(
        and(
          eq(passwordResets.userId, user.id),
          lt(passwordResets.expiresAt, new Date()),
        ),
      );

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      ip,
    });

    const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (err) {
      // Não revela a falha para o usuário anti-enumeration; apenas loga.
      console.error("[password-reset] falha ao enviar e-mail:", err);
    }

    await audit({
      userId: user.id,
      action: "user.password_reset_requested",
      ip,
    });
  } else {
    // Log único rastreável em dev; em prod nada distingue este caso do sucesso.
    console.warn(
      "[password-reset] pedido para e-mail não cadastrado:",
      email,
      "(IP:",
      ip,
      ")",
    );
  }

  // Mensagem idêntica ao caso de sucesso — anti-enumeration.
  return {
    success:
      "Se uma conta existir com este e-mail, enviamos instruções para redefinir sua senha.",
  };
}

/**
 * Redefine a senha com token recebido por e-mail.
 *
 * Validações:
 *  - Token existe em `password_resets` (buscado por hash SHA-256).
 *  - Token ainda não foi usado (usedAt IS NULL).
 *  - Token não expirou (expiresAt > now).
 *
 * Em caso de sucesso:
 *  - Atualiza passwordHash.
 *  - Marca TODOS os tokens pendentes deste usuário como usados (invalida links
 *    antigos).
 *  - Revoga TODAS as sessões abertas (defesa contra invasor que roubou senha
 *    antes da redefinição).
 *  - Cria nova sessão para o dono.
 *
 * Em caso de falha: redireciona para /recuperar-senha evitando revelar
 * detalhes do motivo (token inválido vs expirado vs usado). O exemplo manual
 * é igual para todos os erros.
 */
export async function resetPasswordAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const ip = await getRequestIp();

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const { token, password } = parsed.data;

  const rl = await rateLimit({
    key: `reset:ip:${ip}`,
    limit: 5,
    windowSeconds: 900,
  });
  if (!rl.allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const db = getDb();
  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      reset: passwordResets,
      user: users,
    })
    .from(passwordResets)
    .innerJoin(users, eq(passwordResets.userId, users.id))
    .where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.usedAt)))
    .limit(1);
  const row = rows[0];

  // Mensagem genérica para qualquer falha de validação do token.
  const genericError =
    "O link de redefinição é inválido, expirou ou já foi usado. Solicite um novo.";

  if (!row) return { error: genericError };
  if (row.reset.expiresAt.getTime() < Date.now()) {
    // Limpa o token vencido para liberar a linha.
    await db
      .delete(passwordResets)
      .where(eq(passwordResets.id, row.reset.id))
      .catch(() => undefined);
    return { error: genericError };
  }

  const newHash = await hashPassword(password);

  try {
    // Transação atômica: troca senha + invalida todos os tokens + marca o atual.
    await db.transaction(async (tx) => {
      // Marca o token usado (condicional para evitar race condition).
      const used = await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResets.id, row.reset.id),
            isNull(passwordResets.usedAt),
          ),
        )
        .returning({ id: passwordResets.id });
      if (used.length === 0) {
        throw new Error("token_already_used");
      }

      // Invalida todos os demais tokens pendentes do mesmo usuário.
      await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResets.userId, row.user.id),
            isNull(passwordResets.usedAt),
          ),
        );

      // Atualiza a senha.
      await tx
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, row.user.id));
    });
  } catch (err) {
    if (err instanceof Error && err.message === "token_already_used") {
      return { error: genericError };
    }
    throw err;
  }

  await destroyAllUserSessions(row.user.id);
  await createSession(row.user.id);
  await audit({
    userId: row.user.id,
    action: "user.password_reset",
    ip,
  });

  redirect("/conta");
}
