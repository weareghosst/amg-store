"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminActionState } from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    originCep: string;
    ownDeliveryFee: string;
    ownDeliveryFreeAbove: string;
    ownDeliveryDays: number;
    ownDeliveryScope: "state" | "capital";
    storePhone: string;
    storeEmail: string;
  };
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    saveSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="mt-4 flex max-w-2xl flex-col gap-5">
      <fieldset className="rounded-xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-sm font-bold text-slate-700">
          Entrega própria (dentro de SP)
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-scope" className={labelClass}>Área atendida</label>
            <select
              id="s-scope"
              name="ownDeliveryScope"
              defaultValue={defaults.ownDeliveryScope}
              className={inputClass}
            >
              <option value="state">Estado de São Paulo inteiro</option>
              <option value="capital">Somente capital (município de SP)</option>
            </select>
          </div>
          <div>
            <label htmlFor="s-days" className={labelClass}>Prazo (dias úteis)</label>
            <input
              id="s-days"
              name="ownDeliveryDays"
              type="number"
              min={1}
              max={30}
              required
              defaultValue={defaults.ownDeliveryDays}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="s-fee" className={labelClass}>Taxa de entrega (R$)</label>
            <input
              id="s-fee"
              name="ownDeliveryFee"
              required
              defaultValue={defaults.ownDeliveryFee}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="s-free" className={labelClass}>
              Frete grátis a partir de (R$) — 0 desativa
            </label>
            <input
              id="s-free"
              name="ownDeliveryFreeAbove"
              defaultValue={defaults.ownDeliveryFreeAbove}
              inputMode="decimal"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-sm font-bold text-slate-700">
          Envios (Melhor Envio)
        </legend>
        <div className="max-w-xs">
          <label htmlFor="s-origin" className={labelClass}>
            CEP de origem (endereço do estoque)
          </label>
          <input
            id="s-origin"
            name="originCep"
            required
            defaultValue={defaults.originCep}
            inputMode="numeric"
            maxLength={9}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-sm font-bold text-slate-700">Contato</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-phone" className={labelClass}>Telefone/WhatsApp</label>
            <input id="s-phone" name="storePhone" defaultValue={defaults.storePhone} maxLength={30} className={inputClass} />
          </div>
          <div>
            <label htmlFor="s-email" className={labelClass}>E-mail</label>
            <input id="s-email" name="storeEmail" type="email" defaultValue={defaults.storeEmail} maxLength={120} className={inputClass} />
          </div>
        </div>
      </fieldset>

      <FormMessage error={state.error} success={state.success} />
      <SubmitButton pendingText="Salvando...">Salvar configurações</SubmitButton>
    </form>
  );
}
