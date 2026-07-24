import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configurações — Admin" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Configurações da loja</h1>
      <SettingsForm
        defaults={{
          originCep: settings.originCep,
          ownDeliveryFee: (settings.ownDeliveryFeeCents / 100)
            .toFixed(2)
            .replace(".", ","),
          ownDeliveryFreeAbove: (settings.ownDeliveryFreeAboveCents / 100)
            .toFixed(2)
            .replace(".", ","),
          ownDeliveryDays: settings.ownDeliveryDays,
          ownDeliveryScope: settings.ownDeliveryScope,
          storePhone: settings.storePhone,
          storeEmail: settings.storeEmail,
        }}
      />
    </div>
  );
}
