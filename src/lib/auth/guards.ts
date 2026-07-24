import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "@/db/schema";

/**
 * Camada de acesso a dados (defense in depth): TODA página e TODA server
 * action protegida chama um destes guards no servidor. O front-end nunca
 * é a barreira de segurança — no máximo esconde botões.
 */

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Variante para server actions: lança erro em vez de redirecionar. */
export async function assertAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function assertUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Faça login para continuar.");
  }
  return user;
}
