"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setStatus("error");
      return;
    }
    // TODO: decidir mecanismo da newsletter (persistência no banco ou
    // integração futura de e-mail marketing). Por enquanto só simula o
    // sucesso para validar o fluxo visual.
    setStatus("success");
    setEmail("");
  }

  return (
    <div>
      <p className="font-bold uppercase tracking-wide text-brand-green">
        Newsletter
      </p>
      <p className="mt-2 text-sm text-white/70">
        Receba ofertas e novidades no seu e-mail.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex max-w-sm flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          name="newsletterEmail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
          }}
          placeholder="Seu melhor e-mail"
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-navy transition hover:brightness-110"
        >
          Assinar
        </button>
      </form>
      {status === "success" && (
        <p className="mt-2 text-sm text-brand-green brightness-150">
          Obrigado! Você foi cadastrado na newsletter.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-300">
          Digite um e-mail válido.
        </p>
      )}
    </div>
  );
}