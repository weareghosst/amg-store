import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configurações — Admin" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  let settings = null;
  try {
    settings = await getStoreSettings();
  } catch (error) {
    console.warn("[admin/settings] usando fallback:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Configurações da loja</h1>
      <SettingsForm
        defaults={{
          originCep: settings?.originCep ?? "01001000",
          ownDeliveryFee: ((settings?.ownDeliveryFeeCents ?? 1500) / 100)
            .toFixed(2)
            .replace(".", ","),
          ownDeliveryFreeAbove: ((settings?.ownDeliveryFreeAboveCents ?? 30000) / 100)
            .toFixed(2)
            .replace(".", ","),
          ownDeliveryDays: settings?.ownDeliveryDays ?? 3,
          ownDeliveryScope: settings?.ownDeliveryScope ?? "state",
          storePhone: settings?.storePhone ?? "",
          storeEmail: settings?.storeEmail ?? "",
        }}
      />
    </div>
  );
}
