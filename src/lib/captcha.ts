import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * CAPTCHA local (sem serviço externo): um desafio de aritmética simples.
 *
 * - O servidor gera uma operação com números por extenso ("sete mais tres")
 *   para dificultar OCR de dígitos, e o usuário digita o resultado.
 * - A resposta esperada nunca vai para o navegador: apenas o hash SHA-256 do
 *   resultado fica num cookie httpOnly (uso único), definido por GET /api/captcha.
 * - A validação acontece no servidor nas server actions (cadastro/login) e o
 *   cookie é apagado após o uso (one-time).
 */

export const CAPTCHA_COOKIE = "amg_captcha_hash";
export const CAPTCHA_TTL_SECONDS = 5 * 60;

const NUMBERS = [
  "zero",
  "um",
  "dois",
  "tres",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
  "vinte",
];

export function hashCaptchaAnswer(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateCaptcha(): { question: string; answer: number } {
  const n1 = randomInt(1, 21);
  const n2 = randomInt(1, 21);
  const op = randomInt(0, 3);

  if (op === 0) {
    return { question: `${NUMBERS[n1]} mais ${NUMBERS[n2]}`, answer: n1 + n2 };
  }
  if (op === 1) {
    const a = Math.max(n1, n2);
    const b = Math.min(n1, n2);
    return { question: `${NUMBERS[a]} menos ${NUMBERS[b]}`, answer: a - b };
  }
  return { question: `${NUMBERS[n1]} vezes ${NUMBERS[n2]}`, answer: n1 * n2 };
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * Valida a resposta do captcha a partir do cookie. Consome o desafio
 * (apaga o cookie) mesmo em caso de sucesso, garantindo uso único.
 */
export async function verifyCaptcha(input: unknown): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(CAPTCHA_COOKIE)?.value;
  cookieStore.delete(CAPTCHA_COOKIE);
  if (!stored) return false;

  const digits = String(input ?? "").replace(/[^0-9]/g, "");
  if (digits === "") return false;

  const normalized = String(Number.parseInt(digits, 10));
  if (normalized === "NaN") return false;

  return safeEqualHex(stored, hashCaptchaAnswer(normalized));
}
