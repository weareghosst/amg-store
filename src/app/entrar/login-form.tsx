"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
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
      <div>
        <label htmlFor="password" className={labelClass}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-blue hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
