import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { addresses } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser();
  const db = getDb();
  const savedAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Finalizar compra</h1>
      <CheckoutClient
        needsCpfCnpj={!user.cpfCnpj}
        savedAddresses={savedAddresses.map((a) => ({
          id: a.id,
          label: a.label,
          cep: a.cep,
          street: a.street,
          number: a.number,
          complement: a.complement ?? "",
          district: a.district,
          city: a.city,
          state: a.state,
        }))}
      />
    </div>
  );
}
