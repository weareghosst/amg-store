import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * CAPTCHA local (sem serviço externo): uma imagem SVG com um código
 * alfanumérico distorcido e ruído de fundo.
 *
 * - O servidor gera um código de 6 caracteres (sem caracteres ambíguos) e
 *   desenha o SVG com rotações por letra, linhas e pontos de ruído.
 * - A resposta esperada nunca vai para o navegador: apenas o hash SHA-256 do
 *   código fica num cookie httpOnly de uso único, definido por GET /api/captcha.
 * - A validação acontece no servidor (server actions) e o cookie é apagado
 *   após o uso (one-time).
 */

export const CAPTCHA_COOKIE = "amg_captcha_hash";
export const CAPTCHA_TTL_SECONDS = 5 * 60;
export const CAPTCHA_CODE_LENGTH = 6;

// Sem caracteres ambíguos (0/O, 1/I/l, 5/S trocados por outros).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const COLORS = ["#0f172a", "#1746c8", "#047857", "#9a3412", "#7c3aed", "#0e7490"];

export function hashCaptchaAnswer(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Normaliza a resposta digitada: maiúsculas, só letras/números. */
export function normalizeCaptchaInput(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateCaptchaText(): string {
  // 32 caracteres => 2^5; randomBytes dá bytes uniformes, mod 32 também.
  const bytes = randomBytes(CAPTCHA_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CAPTCHA_CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Monta o SVG do código com distorção e ruído. */
export function renderCaptchaSvg(text: string): string {
  const w = 200;
  const h = 60;
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  // Ruído de fundo: linhas finas variadas.
  let noise = "";
  const lineCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < lineCount; i++) {
    const x1 = Math.random() * w;
    const y1 = Math.random() * h;
    const x2 = x1 + (Math.random() - 0.5) * 90;
    const y2 = y1 + (Math.random() - 0.5) * 60;
    const stroke = `rgba(15,23,42,${(0.1 + Math.random() * 0.25).toFixed(2)})`;
    noise += `<line x1='${x1.toFixed(0)}' y1='${y1.toFixed(0)}' x2='${x2.toFixed(0)}' y2='${y2.toFixed(0)}' stroke='${stroke}' stroke-width='1'/>`;
  }

  // Pontos de ruído.
  let dots = "";
  const dotCount = 24 + Math.floor(Math.random() * 20);
  for (let i = 0; i < dotCount; i++) {
    const dx = (Math.random() * w).toFixed(0);
    const dy = (Math.random() * h).toFixed(0);
    const r = (Math.random() * 1.4 + 0.4).toFixed(1);
    const fill = `rgba(15,23,42,${(0.12 + Math.random() * 0.3).toFixed(2)})`;
    dots += `<circle cx='${dx}' cy='${dy}' r='${r}' fill='${fill}'/>`;
  }

  // Letras individuais com rotação e deslocamento vertical aleatórios.
  const charW = w / text.length;
  let letters = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const x = charW * i + charW / 2;
    const y = 34 + (Math.random() - 0.5) * 14;
    const rot = clamp((Math.random() * 2 - 1) * 26, -26, 26).toFixed(1);
    const fontSize = (30 + Math.random() * 5).toFixed(1);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    letters += `<text x='${x.toFixed(1)}' y='${y.toFixed(1)}' font-family='monospace' font-size='${fontSize}' font-weight='bold' fill='${color}' transform='rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})' text-anchor='middle'>${ch}</text>`;
  }

  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' role='img' aria-label='codigo de verificacao'><rect width='${w}' height='${h}' fill='#f1f5f9'/>${noise}${dots}${letters}</svg>`;
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

  const normalized = normalizeCaptchaInput(String(input ?? ""));
  if (normalized.length !== CAPTCHA_CODE_LENGTH) return false;

  return safeEqualHex(stored, hashCaptchaAnswer(normalized));
}