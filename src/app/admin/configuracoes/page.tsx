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
          storePhone: settings?.storePhone ?? "",
          storeEmail: settings?.storeEmail ?? "",
        }}
      />
    </div>
  );
}
