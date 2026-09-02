"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/actions/auth";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nome completo / Razão social
        </label>
        <input id="name" name="name" required maxLength={120} className={inputClass} />
      </div>
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
          Senha (mínimo 8 caracteres)
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
      <div>
        <label htmlFor="phone" className={labelClass}>
          Telefone/WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          placeholder="(11) 99999-9999"
          className={inputClass}
        />
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Criando conta...">Criar conta</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-brand-blue hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
