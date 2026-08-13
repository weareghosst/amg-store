import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  // Permitir continuar mesmo logado, mas em caso de sucesso a action redireciona.
  if (user) redirect("/conta");

  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Redefinir senha</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escolha uma nova senha para a sua conta.
      </p>
      <Suspense>
        <ResetForm token={typeof token === "string" ? token : ""} />
      </Suspense>
    </div>
  );
}
