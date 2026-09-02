"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminActionState } from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function SettingsForm({
  defaults,
}: {
  defaults: {
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
        <legend className="px-1 text-sm font-bold text-slate-700">Contato</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-phone" className={labelClass}>Telefone/WhatsApp</label>
            <input id="s-phone" name="storePhone" defaultValue={defaults.storePhone} maxLength={30} className={inputClass} />
            <p className="mt-1 text-xs text-slate-400">
              Usado no botão flutuante e nos botões &quot;Comprar pelo WhatsApp&quot; dos produtos.
            </p>
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
