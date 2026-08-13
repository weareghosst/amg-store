"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type ResetRequestState,
} from "@/actions/password-reset";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function RequestResetForm() {
  const [state, formAction] = useActionState<ResetRequestState, FormData>(
    requestPasswordResetAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton pendingText="Enviando...">Enviar link de recuperação</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="font-medium text-brand-blue hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
