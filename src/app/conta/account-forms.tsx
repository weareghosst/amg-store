"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  updateProfileAction,
  type ActionState,
} from "@/actions/account";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; phone: string };
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
      <div>
        <label htmlFor="profile-phone" className={labelClass}>
          Telefone/WhatsApp
        </label>
        <input
          id="profile-phone"
          name="phone"
          defaultValue={defaults.phone}
          inputMode="tel"
          className={inputClass}
        />
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
