/** Labels e cores de status do pedido (seguro para uso no cliente). */

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  processing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

export const SHIPPING_METHOD_LABEL: Record<string, string> = {
  own_delivery: "Entrega própria AMG",
  melhor_envio: "Melhor Envio",
};
