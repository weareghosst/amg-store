import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isNotNull, lt, or } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResets, rateLimits, sessions } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron de limpeza — remove registros expirados/usados das tabelas
 * `sessions`, `rate_limits` e `password_resets`. Sem estas limpezas as
 * tabelas crescem indefinidamente em serverless (sem cron de DB).
 *
 * Agendamento: configure um job (Vercel Cron, GitHub Actions, Upstash
 * QStash, etc.) para chamar `GET /api/cron/cleanup` no mínimo 1x/dia
 * enviando o header `x-cron-secret: <CRON_SECRET>`.
 *
 * Segurança: sem CRON_SECRET configurado, o endpoint rejeita tudo. A
 * comparação usa timingSafeEqual para não vazar comprimento do token.
 */
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const received = req.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = new Date();

  // Limpa sessões expiradas.
  const sessionsDeleted = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.tokenHash });

  // Limpa rate_limits vencidos (janela Reset_at já passou).
  const rateLimitsDeleted = await db
    .delete(rateLimits)
    .where(lt(rateLimits.resetAt, now))
    .returning({ id: rateLimits.key });

  // Limpa tokens de reset de senha: expirados OU já usados (usados recentes
  // são mantidos no DB só pra log; removemos aqui nas limpezas diárias).
  const resetsDeleted = await db
    .delete(passwordResets)
    .where(
      or(lt(passwordResets.expiresAt, now), isNotNull(passwordResets.usedAt)),
    )
    .returning({ id: passwordResets.id });

  return NextResponse.json({
    ok: true,
    deleted: {
      sessions: sessionsDeleted.length,
      rateLimits: rateLimitsDeleted.length,
      passwordResets: resetsDeleted.length,
    },
  });
}
