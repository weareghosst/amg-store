import type { Metadata } from "next";
import { QuoteCartPage } from "@/components/quote-cart-page";
import { getWhatsAppPhone } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Solicitar orçamento",
  description: "Monte sua lista de produtos e solicite um orçamento para a AMG pelo WhatsApp.",
};

export default async function OrcamentoPage() {
  return <QuoteCartPage phone={await getWhatsAppPhone()} />;
}
