import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/conta");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Entrar</h1>
      <p className="mt-1 text-sm text-slate-500">
        Acesse sua conta para acompanhar pedidos.
      </p>
      <Suspense>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          showDemoCreds={process.env.NODE_ENV !== "production"}
        />
      </Suspense>
    </div>
  );
}
