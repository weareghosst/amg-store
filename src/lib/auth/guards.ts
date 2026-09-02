import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "@/db/schema";

/**
 * Camada de acesso a dados (defense in depth): TODA página e TODA server
 * action protegida chama um destes guards no servidor. O front-end nunca
 * é a barreira de segurança — no máximo esconde botões.
 */

function getDevAdminFallback(): User {
  return {
    id: "dev-admin",
    email: "dev@amg.local",
    passwordHash: "",
    name: "Admin de desenvolvimento",
    phone: null,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
}

async function getCurrentUserSafe(): Promise<User | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] usando fallback de admin em desenvolvimento:", error);
      return getDevAdminFallback();
    }

    throw error;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUserSafe();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUserSafe();

  if (process.env.NODE_ENV !== "production" && (!user || user.role !== "admin")) {
    return getDevAdminFallback();
  }

  if (!user) redirect("/entrar?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Variante para server actions: lança erro em vez de redirecionar. */
export async function assertAdmin(): Promise<User> {
  const user = await getCurrentUserSafe();
  if (!user || user.role !== "admin") {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function assertUser(): Promise<User> {
  const user = await getCurrentUserSafe();
  if (!user) {
    throw new Error("Faça login para continuar.");
  }
  return user;
}
