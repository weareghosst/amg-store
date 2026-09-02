import "server-only";
import { getStoreSettings } from "./settings";

/**
 * Resolve o número de WhatsApp da loja no formato internacional (só dígitos).
 * Prioridade: Admin > Configurações; fallback: variável de ambiente
 * WHATSAPP_PHONE (útil antes de o banco estar configurado).
 */
export async function getWhatsAppPhone(): Promise<string> {
  let phone = "";
  try {
    phone = (await getStoreSettings()).storePhone;
  } catch {
    // banco indisponível: cai no fallback de ambiente
  }
  phone = phone || process.env.WHATSAPP_PHONE || "";

  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") && digits.length >= 12
    ? digits
    : `55${digits}`;
}

/** Monta o link wa.me com mensagem pré-preenchida. */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
