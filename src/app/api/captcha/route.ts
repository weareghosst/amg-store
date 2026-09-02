import { NextResponse } from "next/server";
import {
  CAPTCHA_COOKIE,
  CAPTCHA_TTL_SECONDS,
  generateCaptchaText,
  hashCaptchaAnswer,
  renderCaptchaSvg,
} from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gera a imagem do CAPTCHA. Devolve um SVG com o código e guarda o hash da
 * resposta esperada num cookie httpOnly de uso único.
 */
export async function GET() {
  const text = generateCaptchaText();

  const res = new NextResponse(renderCaptchaSvg(text), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Vary: "Cookie",
    },
  });
  res.cookies.set(CAPTCHA_COOKIE, hashCaptchaAnswer(text), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CAPTCHA_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}