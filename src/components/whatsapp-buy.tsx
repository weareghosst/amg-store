import { formatBRL } from "@/lib/money";
import { buildWhatsAppLink, getWhatsAppPhone } from "@/lib/whatsapp";

interface BuyProduct {
  name: string;
  slug: string;
  sku?: string | null;
  priceCents: number;
  stock: number;
}

/**
 * Botão "Comprar pelo WhatsApp" — abre uma conversa com o vendedor já com
 * uma mensagem identificando o produto (nome, SKU, preço e link).
 *
 * O número vem de Admin > Configurações (fallback: env WHATSAPP_PHONE).
 * Se nenhum número estiver configurado, o botão não é renderizado.
 */
export async function WhatsAppBuy({ product }: { product: BuyProduct }) {
  const phone = await getWhatsAppPhone();
  if (!phone) return null;

  const outOfStock = product.stock <= 0;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");

  const lines = [
    outOfStock
      ? "Olá! Vi um produto esgotado no site da AMG e quero saber quando estará disponível:"
      : "Olá! Vim pelo site da AMG e tenho interesse neste produto:",
    "",
    `${product.name}${product.sku ? ` (cód. ${product.sku})` : ""}`,
    `Preço anunciado: ${formatBRL(product.priceCents)}`,
  ];
  if (appUrl) lines.push(`${appUrl}/produtos/${product.slug}`);
  lines.push(
    "",
    outOfStock
      ? "Podem me avisar quando chegar?"
      : "Pode me passar mais informações?",
  );

  return (
    <a
      href={buildWhatsAppLink(phone, lines.join("\n"))}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white transition ${
        outOfStock
          ? "bg-slate-400 hover:bg-slate-500"
          : "bg-brand-green hover:bg-brand-green-dark"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
      </svg>
      {outOfStock ? "Avise-me quando chegar" : "Comprar pelo WhatsApp"}
    </a>
  );
}
