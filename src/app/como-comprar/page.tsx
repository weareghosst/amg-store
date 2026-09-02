import type { Metadata } from "next";
import { getStoreSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Como Comprar",
  description:
    "Veja como comprar na AMG — Centro de Distribuição: este site é um mostruário dos produtos e a compra é feita diretamente pelo WhatsApp.",
};

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export default async function ComoComprarPage() {
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getStoreSettings();
  } catch {
    // banco indisponível: usa os padrões (sem contato)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
        Como Comprar
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Simples e rápido, direto pelo WhatsApp
      </p>

      <div className="prose-amg mt-8 space-y-8 text-slate-700">
        <section>
          <p>
            Este site funciona como um <strong>mostruário</strong> dos nossos
            produtos. Para comprar, o atendimento é feito diretamente pelo{" "}
            <strong>WhatsApp</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">Passo a passo</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              <strong>Navegue pelo site</strong> e conheça os produtos e
              categorias disponíveis.
            </li>
            <li>
              No produto de interesse, clique em{" "}
              <strong>&quot;Comprar pelo WhatsApp&quot;</strong>. Isso abrirá
              uma conversa com a nossa equipe já levando o nome do produto.
            </li>
            <li>
              <strong>Converse com a gente</strong>: confirmamos preço, estoque
              e formas de pagamento.
            </li>
            <li>
              <strong>Combine a entrega</strong> — entregamos em São Paulo e
              enviamos para todo o Brasil.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">Atendimento</h2>
          <ul className="mt-3 space-y-1">
            {settings.storeEmail && (
              <li>
                E-mail:{" "}
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="font-medium text-brand-blue underline"
                >
                  {settings.storeEmail}
                </a>
              </li>
            )}
            {settings.storePhone && (
              <li>
                WhatsApp:{" "}
                <a
                  href={`https://wa.me/55${settings.storePhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-blue underline"
                >
                  {formatPhoneDisplay(settings.storePhone)}
                </a>
              </li>
            )}
            {!settings.storeEmail && !settings.storePhone && (
              <li>Fale conosco pelos nossos canais de atendimento.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}