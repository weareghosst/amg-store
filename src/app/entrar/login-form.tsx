"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";
import { CaptchaField } from "@/components/captcha-field";

export function LoginForm({ next, showDemoCreds }: { next?: string; showDemoCreds?: boolean }) {
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
      <CaptchaField />
      <FormMessage error={state.error} />
      {showDemoCreds && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Acesso temporário para a cliente</p>
          <p className="mt-1">
            Credenciais definidas nas env vars{" "}
            <span className="font-mono">TEMP_ADMIN_EMAIL</span> e{" "}
            <span className="font-mono">TEMP_ADMIN_PASSWORD</span>. (Aparece apenas
            fora de produção.)
          </p>
        </div>
      )}
      <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Esqueceu a senha?{" "}
        <Link href="/recuperar-senha" className="font-medium text-brand-blue hover:underline">
          Recuperar
        </Link>
      </p>
      <p className="text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-blue hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
