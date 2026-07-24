"use client";

import { useActionState, useTransition } from "react";
import {
  addAddressAction,
  changePasswordAction,
  deleteAddressAction,
  updateProfileAction,
  type ActionState,
} from "@/actions/account";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; phone: string; cpfCnpj: string };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfileAction,
    {},
  );
  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div>
        <label htmlFor="profile-name" className={labelClass}>
          Nome / Razão social
        </label>
        <input
          id="profile-name"
          name="name"
          defaultValue={defaults.name}
          required
          maxLength={120}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="profile-phone" className={labelClass}>
            Telefone
          </label>
          <input
            id="profile-phone"
            name="phone"
            defaultValue={defaults.phone}
            inputMode="tel"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-doc" className={labelClass}>
            CPF/CNPJ
          </label>
          <input
            id="profile-doc"
            name="cpfCnpj"
            defaultValue={defaults.cpfCnpj}
            inputMode="numeric"
            className={inputClass}
          />
        </div>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton pendingText="Salvando...">Salvar dados</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    changePasswordAction,
    {},
  );
  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div>
        <label htmlFor="current-password" className={labelClass}>
          Senha atual
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="new-password" className={labelClass}>
          Nova senha (mínimo 8 caracteres)
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton pendingText="Alterando...">Alterar senha</SubmitButton>
    </form>
  );
}

export function AddressList({
  addresses,
}: {
  addresses: { id: string; label: string; summary: string }[];
}) {
  const [addState, addFormAction] = useActionState<ActionState, FormData>(
    addAddressAction,
    {},
  );
  const [deleting, startDeleting] = useTransition();

  return (
    <div className="mt-3 flex flex-col gap-3">
      {addresses.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum endereço salvo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-slate-700">{a.label}</span>
                <span className="block text-xs text-slate-500">{a.summary}</span>
              </span>
              <button
                type="button"
                disabled={deleting}
                onClick={() => startDeleting(() => void deleteAddressAction(a.id))}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-brand-blue">
          Adicionar endereço
        </summary>
        <form action={addFormAction} className="mt-3 grid grid-cols-2 gap-2">
          <input name="label" placeholder="Apelido (ex.: Loja)" maxLength={40} className={inputClass} />
          <input name="cep" placeholder="CEP" required inputMode="numeric" maxLength={9} className={inputClass} />
          <input name="street" placeholder="Rua" required maxLength={160} className={`${inputClass} col-span-2`} />
          <input name="number" placeholder="Número" required maxLength={20} className={inputClass} />
          <input name="complement" placeholder="Complemento" maxLength={80} className={inputClass} />
          <input name="district" placeholder="Bairro" required maxLength={80} className={inputClass} />
          <div className="grid grid-cols-[1fr_64px] gap-2">
            <input name="city" placeholder="Cidade" required maxLength={80} className={inputClass} />
            <input name="state" placeholder="UF" required maxLength={2} className={inputClass} />
          </div>
          <div className="col-span-2">
            <FormMessage error={addState.error} success={addState.success} />
          </div>
          <div className="col-span-2">
            <SubmitButton pendingText="Salvando...">Salvar endereço</SubmitButton>
          </div>
        </form>
      </details>
    </div>
  );
}
