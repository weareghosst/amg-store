import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { cache } from "react";

const SESSION_COOKIE = "amg_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias
const RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // renova se faltar < 15 dias

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Cria uma sessão para o usuário. O token (aleatório, 256 bits) vai apenas
 * no cookie httpOnly; no banco fica somente o hash SHA-256.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  const h = await headers();
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    ip: await getRequestIp(),
    userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Revoga todas as sessões de um usuário (ex.: troca de senha). */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Valida a sessão do cookie e devolve o usuário atual, ou null.
 * `cache` garante uma única consulta por requisição.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const tokenHash = hashToken(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    return null;
  }

  // Renovação deslizante da sessão
  if (row.session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_DURATION_MS) })
      .where(eq(sessions.tokenHash, tokenHash));
  }

  return row.user;
});

/** Limpeza oportunista de sessões expiradas. */
export async function pruneExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
