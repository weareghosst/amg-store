import "server-only";

import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users, type User } from "@/db/schema";

const MOBILE_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const MOBILE_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,512})$/);
  return match?.[1] ?? null;
}

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export type MobileUser = Pick<User, "id" | "name" | "email" | "phone" | "role">;

export function toMobileUser(user: User): MobileUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export async function createMobileSession(userId: string, request: Request): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + MOBILE_SESSION_DURATION_MS),
    ip: requestIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null,
  });
  return token;
}

export async function getMobileUser(request: Request): Promise<User | null> {
  const token = bearerToken(request);
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

  if (row.session.expiresAt.getTime() - Date.now() < MOBILE_RENEW_THRESHOLD_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + MOBILE_SESSION_DURATION_MS) })
      .where(eq(sessions.tokenHash, tokenHash));
  }

  return row.user;
}

export async function destroyMobileSession(request: Request): Promise<User | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const user = await getMobileUser(request);
  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  return user;
}

export function getMobileRequestIp(request: Request): string {
  return requestIp(request);
}
