import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RequestResetForm } from "./request-reset-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Recuperar senha" };

export default async function RequestResetPage() {
  const user = await getCurrentUser();
  // Já logado: não tem sentido pedir reset.
  if (user) redirect("/conta");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Recuperar senha</h1>
      <p className="mt-1 text-sm text-slate-500">
        Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
      </p>
      <Suspense>
        <RequestResetForm />
      </Suspense>
    </div>
  );
}
