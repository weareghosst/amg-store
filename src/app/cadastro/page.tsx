import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/conta");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Criar conta</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pessoa física ou jurídica — atendemos os dois.
      </p>
      <RegisterForm />
    </div>
  );
}
