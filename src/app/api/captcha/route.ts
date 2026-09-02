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

  const res = new Response(renderCaptchaSvg(text), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
  res.headers.append(
    "Set-Cookie",
    `${CAPTCHA_COOKIE}=${hashCaptchaAnswer(text)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${CAPTCHA_TTL_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return res;
}