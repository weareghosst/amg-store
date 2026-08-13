"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resetPasswordAction,
  type ResetRequestState,
} from "@/actions/password-reset";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<ResetRequestState, FormData>(
    resetPasswordAction,
    {},
  );

  if (!token) {
    return (
      <div className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        Link inválido. Solicite uma nova redefinição pelo formulário{" "}
        <Link href="/recuperar-senha" className="underline">
          Recuperar senha
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className={labelClass}>
          Nova senha (mínimo 8 caracteres)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Redefinindo...">Redefinir senha</SubmitButton>
    </form>
  );
}
