"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  createTemporaryAdminSession,
  destroySession,
  getCurrentUser,
  getRequestIp,
} from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { audit } from "@/lib/audit";
import {
  firstZodError,
  loginSchema,
  registerSchema,
} from "@/lib/validation/schemas";

export interface AuthFormState {
  error?: string;
}

// Hash fixo usado quando o e-mail não existe: o tempo de resposta do login
// fica igual nos dois casos, impedindo enumeração de e-mails por timing.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZbF0LMPtcuBRqmxYQ4XU2XVftGvOhK";

function safeNextPath(raw: FormDataEntryValue | null): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await getRequestIp();
  const captchaOk = await verifyCaptcha(formData.get("captcha"));
  if (!captchaOk) {
    return { error: "Verificação de segurança inválida. Tente novamente." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { name, email, password, phone } = parsed.data;

  // Rate limiting reforçado, três camadas independentes:
  // 1. Por IP: limita cadastros vindos do mesmo dispositivo;
  // 2. Por e-mail: limita tentativas/usos do mesmo e-mail; e
  // 3. Global: teto de contas novas no site por hora (anti-bot).
  const [rlIp, rlEmail, rlGlobal] = await Promise.all([
    rateLimit({ key: `register:ip:${ip}`, limit: 3, windowSeconds: 900 }),
    rateLimit({ key: `register:email:${email}`, limit: 3, windowSeconds: 3600 }),
    rateLimit({ key: `register:global`, limit: 20, windowSeconds: 3600 }),
  ]);
  if (!rlIp.allowed) {
    return { error: "Muitos cadastros deste dispositivo. Aguarde alguns minutos." };
  }
  if (!rlEmail.allowed) {
    return { error: "Muitas tentativas com este e-mail. Tente novamente mais tarde." };
  }
  if (!rlGlobal.allowed) {
    return { error: "Muitos cadastros em um curto período. Tente novamente mais tarde." };
  }

  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      phone: phone || null,
    })
    .returning({ id: users.id });

  await createSession(user.id);
  await audit({ userId: user.id, action: "user.register", ip });

  redirect(safeNextPath(formData.get("next")));
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await getRequestIp();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const { email, password } = parsed.data;

  if (process.env.NODE_ENV !== "production") {
    const tempAdminEmail = process.env.TEMP_ADMIN_EMAIL;
    const tempAdminPassword = process.env.TEMP_ADMIN_PASSWORD;
    if (
      tempAdminEmail &&
      tempAdminPassword &&
      process.env.TEMP_ADMIN_SESSION_TOKEN &&
      email === tempAdminEmail &&
      password === tempAdminPassword
    ) {
      await createTemporaryAdminSession();
      await audit({
        action: "user.login",
        detail: { email, source: "temporary-admin" },
        ip,
      });
      redirect(safeNextPath(formData.get("next")));
    }
  }

  const captchaOk = await verifyCaptcha(formData.get("captcha"));
  if (!captchaOk) {
    return { error: "Verificação de segurança inválida. Tente novamente." };
  }

  const [rlIp, rlEmail] = await Promise.all([
    rateLimit({ key: `login:ip:${ip}`, limit: 10, windowSeconds: 900 }),
    rateLimit({ key: `login:email:${email}`, limit: 8, windowSeconds: 900 }),
  ]);
  if (!rlIp.allowed || !rlEmail.allowed) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos." };
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await audit({ action: "user.login_failed", detail: { email }, ip });
    return { error: "E-mail ou senha incorretos." };
  }

  await createSession(user.id);
  await audit({ userId: user.id, action: "user.login", ip });

  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await audit({ userId: user.id, action: "user.logout" });
  }
  redirect("/");
}
