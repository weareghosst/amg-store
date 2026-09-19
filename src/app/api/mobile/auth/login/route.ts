import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import {
  createMobileSession,
  getMobileRequestIp,
  toMobileUser,
} from "@/lib/auth/mobile-session";
import {
  mobileAuthHeaders,
  mobileAuthOptionsResponse,
} from "@/lib/mobile-api";
import { rateLimit } from "@/lib/rate-limit";
import { firstZodError, loginSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZbF0LMPtcuBRqmxYQ4XU2XVftGvOhK";

export function OPTIONS() {
  return mobileAuthOptionsResponse();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Dados de acesso inválidos." },
      { status: 400, headers: mobileAuthHeaders },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstZodError(parsed.error) },
      { status: 400, headers: mobileAuthHeaders },
    );
  }

  const { email, password } = parsed.data;
  const ip = getMobileRequestIp(request);
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit({ key: `mobile-login:ip:${ip}`, limit: 10, windowSeconds: 900 }),
    rateLimit({ key: `mobile-login:email:${email}`, limit: 8, windowSeconds: 900 }),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas de login. Aguarde alguns minutos." },
      { status: 429, headers: mobileAuthHeaders },
    );
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await audit({ action: "user.login_failed", detail: { email, source: "aplicativo" }, ip });
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401, headers: mobileAuthHeaders },
    );
  }

  const token = await createMobileSession(user.id, request);
  await audit({ userId: user.id, action: "user.login", detail: { source: "aplicativo" }, ip });
  return NextResponse.json(
    { token, user: toMobileUser(user) },
    { headers: mobileAuthHeaders },
  );
}
