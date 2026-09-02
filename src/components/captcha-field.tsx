"use client";

import { useEffect, useState } from "react";
import { inputClass, labelClass } from "@/components/forms";

export function CaptchaField() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/captcha", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((d) => {
        if (active) {
          setQuestion(typeof d.question === "string" ? d.question : "");
          setLoading(false);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tries]);

  const handleRefresh = () => {
    setLoading(true);
    setFailed(false);
    setTries((t) => t + 1);
  };

  return (
    <div>
      <label className={labelClass}>Verificação de segurança</label>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            Carregando...
          </span>
        ) : failed ? (
          <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Falha ao carregar.
          </span>
        ) : (
          <span className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
            {question}
          </span>
        )}
        <button
          type="button"
          onClick={handleRefresh}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          Trocar
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Digite o resultado da conta em números.
      </p>
      <input
        name="captcha"
        inputMode="numeric"
        autoComplete="off"
        required
        maxLength={4}
        placeholder="Resposta"
        className={`${inputClass} mt-1`}
      />
    </div>
  );
}
