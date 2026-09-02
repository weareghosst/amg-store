import { requireUser } from "@/lib/auth/guards";
import { ProfileForm, PasswordForm } from "./account-forms";

export const dynamic = "force-dynamic";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Minha conta</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Meus dados</h2>
          <ProfileForm
            defaults={{
              name: user.name,
              phone: user.phone ?? "",
            }}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Alterar senha</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
