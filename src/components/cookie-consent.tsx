"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "amg-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(STORAGE_KEY);
    if (!choice) setVisible(true);
  }, []);

  function handleChoice(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-600">
          Usamos cookies para melhorar sua experiência e analisar dados de
          navegação. Você pode aceitar ou recusar o uso de cookies não
          essenciais. Saiba mais na nossa{" "}
          <Link
            href="/privacidade"
            className="font-medium text-brand-blue underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleChoice("declined")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => handleChoice("accepted")}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
