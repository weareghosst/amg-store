import { NextResponse } from "next/server";
import {
  CAPTCHA_COOKIE,
  CAPTCHA_TTL_SECONDS,
  generateCaptcha,
  hashCaptchaAnswer,
} from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gera um desafio de captcha. Retorna a pergunta ao cliente e guarda o hash
 * da resposta esperada num cookie httpOnly de uso único.
 */
export async function GET() {
  const { question, answer } = generateCaptcha();

  const res = NextResponse.json({ question });
  res.cookies.set(CAPTCHA_COOKIE, hashCaptchaAnswer(String(answer)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CAPTCHA_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
