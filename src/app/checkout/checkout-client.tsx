"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/money";
import { inputClass, labelClass } from "@/components/forms";
import { lookupCepAction, quoteShippingAction } from "@/actions/shipping";
import { placeOrderAction } from "@/actions/checkout";
import type { QuoteOption } from "@/lib/shipping/quote";

interface SavedAddress {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

interface AddressForm {
  label: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

const EMPTY_ADDRESS: AddressForm = {
  label: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

export function CheckoutClient({
  savedAddresses,
  needsCpfCnpj,
}: {
  savedAddresses: SavedAddress[];
  needsCpfCnpj: boolean;
}) {
  const { items, ready, subtotalCents, clear } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(savedAddresses.length === 0);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [quote, setQuote] = useState<{ quoteId: string; options: QuoteOption[] } | null>(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [quoting, startQuoting] = useTransition();
  const [placing, startPlacing] = useTransition();

  const cartItems = items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
  }));

  if (!ready) {
    return <p className="mt-8 text-center text-slate-400">Carregando...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-500">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="mt-3 inline-block font-medium text-brand-blue hover:underline">
          Ver produtos →
        </Link>
      </div>
    );
  }

  const setField = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Endereço mudou de CEP: a cotação anterior deixa de valer
    if (field === "cep") setQuote(null);
  };

  const handleCepBlur = async () => {
    const digits = address.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const info = await lookupCepAction(digits);
      if (info) {
        setAddress((prev) => ({
          ...prev,
          cep: digits,
          street: info.street || prev.street,
          district: info.district || prev.district,
          city: info.city || prev.city,
          state: info.state || prev.state,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleQuote = () => {
    setError(null);
    const digits = address.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Informe um CEP válido para calcular o frete.");
      return;
    }
    startQuoting(async () => {
      const result = await quoteShippingAction({ cep: digits, items: cartItems });
      if (result.error || !result.quoteId || !result.options) {
        setError(result.error ?? "Não foi possível calcular o frete.");
        setQuote(null);
        return;
      }
      setQuote({ quoteId: result.quoteId, options: result.options });
      setSelectedOption(0);
    });
  };

  const handlePlaceOrder = () => {
    setError(null);
    if (!quote) {
      setError("Calcule o frete antes de finalizar.");
      return;
    }
    for (const field of ["street", "number", "district", "city", "state"] as const) {
      if (!address[field].trim()) {
        setError("Preencha o endereço completo.");
        return;
      }
    }
    startPlacing(async () => {
      const result = await placeOrderAction({
        quoteId: quote.quoteId,
        optionIndex: selectedOption,
        items: cartItems,
        address: { ...address, cep: address.cep.replace(/\D/g, "") },
        saveAddress,
        cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      });
      if (result.error || !result.orderCode) {
        setError(result.error ?? "Erro ao criar o pedido.");
        return;
      }
      clear();
      router.push(`/conta/pedidos/${result.orderCode}`);
    });
  };

  const shippingCents = quote?.options[selectedOption]?.priceCents ?? null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {/* Endereço */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">1. Endereço de entrega</h2>

          {savedAddresses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAddress({ ...a });
                    setQuote(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-blue hover:text-brand-blue"
                >
                  {a.label} — {a.street}, {a.number}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cep" className={labelClass}>
                CEP {cepLoading && <span className="text-slate-400">(buscando...)</span>}
              </label>
              <input
                id="cep"
                value={address.cep}
                onChange={(e) => setField("cep", e.target.value)}
                onBlur={handleCepBlur}
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="label" className={labelClass}>
                Apelido do endereço
              </label>
              <input
                id="label"
                value={address.label}
                onChange={(e) => setField("label", e.target.value)}
                placeholder="Ex.: Escritório"
                maxLength={40}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="street" className={labelClass}>
                Rua / Avenida
              </label>
              <input
                id="street"
                value={address.street}
                onChange={(e) => setField("street", e.target.value)}
                maxLength={160}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="number" className={labelClass}>
                Número
              </label>
              <input
                id="number"
                value={address.number}
                onChange={(e) => setField("number", e.target.value)}
                maxLength={20}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="complement" className={labelClass}>
                Complemento
              </label>
              <input
                id="complement"
                value={address.complement}
                onChange={(e) => setField("complement", e.target.value)}
                maxLength={80}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="district" className={labelClass}>
                Bairro
              </label>
              <input
                id="district"
                value={address.district}
                onChange={(e) => setField("district", e.target.value)}
                maxLength={80}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div>
                <label htmlFor="city" className={labelClass}>
                  Cidade
                </label>
                <input
                  id="city"
                  value={address.city}
                  onChange={(e) => setField("city", e.target.value)}
                  maxLength={80}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  UF
                </label>
                <input
                  id="state"
                  value={address.state}
                  onChange={(e) => setField("state", e.target.value.toUpperCase())}
                  maxLength={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Salvar este endereço para próximas compras
          </label>
        </section>

        {/* Frete */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">2. Frete</h2>
            <button
              type="button"
              onClick={handleQuote}
              disabled={quoting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {quoting ? "Calculando..." : "Calcular frete"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Dentro de SP: entrega própria AMG. Fora de SP: transportadoras via
            Melhor Envio.
          </p>

          {quote && (
            <div className="mt-4 flex flex-col gap-2">
              {quote.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition ${
                    selectedOption === index
                      ? "border-brand-blue bg-brand-blue/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        {option.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        até {option.deliveryDays} dia(s) útil(eis)
                      </span>
                    </span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {option.priceCents === 0 ? "Grátis" : formatBRL(option.priceCents)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* CPF/CNPJ */}
        {needsCpfCnpj && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">3. Documento para faturamento</h2>
            <p className="mt-1 text-xs text-slate-400">
              Necessário para emitir a cobrança (Pix, boleto ou cartão).
            </p>
            <div className="mt-3 max-w-xs">
              <label htmlFor="cpfCnpj" className={labelClass}>
                CPF ou CNPJ
              </label>
              <input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                inputMode="numeric"
                placeholder="Somente números"
                maxLength={18}
                className={inputClass}
              />
            </div>
          </section>
        )}
      </div>

      {/* Resumo */}
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
        <h2 className="font-bold text-slate-800">Resumo do pedido</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2">
              <span className="text-slate-600">
                {item.quantity}× {item.name}
              </span>
              <span className="shrink-0 font-medium text-slate-800">
                {formatBRL(item.priceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium">{formatBRL(subtotalCents)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-500">Frete</span>
            <span className="font-medium">
              {shippingCents === null
                ? "—"
                : shippingCents === 0
                  ? "Grátis"
                  : formatBRL(shippingCents)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-blue">
              {shippingCents === null ? "—" : formatBRL(subtotalCents + shippingCents)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placing || !quote}
          className="mt-4 w-full rounded-lg bg-brand-green px-4 py-3 font-semibold text-white transition hover:bg-brand-green-dark disabled:opacity-50"
        >
          {placing ? "Gerando pedido..." : "Confirmar pedido"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Você escolhe Pix, boleto ou cartão na página segura do Asaas. Os
          valores são sempre revalidados no servidor.
        </p>
      </aside>
    </div>
  );
}
