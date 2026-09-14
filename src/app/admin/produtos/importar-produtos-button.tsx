"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importarProdutosRecebidosAction } from "@/actions/admin";

export function ImportarProdutosButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function importar() {
    startTransition(async () => {
      const result = await importarProdutosRecebidosAction();
      setMessage(result.error ?? result.success ?? "");
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={importar}
        disabled={pending}
        className="rounded-lg border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/5 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Importando..." : "Importar produtos recebidos"}
      </button>
      {message && <p className="max-w-xs text-right text-xs text-slate-500">{message}</p>}
    </div>
  );
}
