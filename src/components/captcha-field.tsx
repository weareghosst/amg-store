"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/forms";

export function CaptchaField() {
  const [version, setVersion] = useState(0);

  return (
    <div>
      <label className={labelClass}>Verificação de segurança</label>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/captcha?v=${version}`}
          alt="Código de verificação"
          width={200}
          height={60}
          className="h-[60px] w-[200px] rounded-lg border border-slate-300 bg-slate-50"
        />
        <button
          type="button"
          onClick={() => setVersion((v) => v + 1)}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          Trocar
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Digite os caracteres da imagem (letras e números).
      </p>
      <input
        name="captcha"
        autoComplete="off"
        required
        maxLength={6}
        placeholder="Ex.: GR7K2Q"
        className={`${inputClass} mt-1 uppercase`}
      />
    </div>
  );
}