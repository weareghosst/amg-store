import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a AMG — Centro de Distribuição de produtos de limpeza, higiene, EPIs e variedades. Atacado e varejo com entrega própria.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
        Sobre Nós
      </h1>
      <p className="mt-2 text-sm text-slate-500">Quem somos</p>

      <div className="prose-amg mt-8 space-y-8 text-slate-700">
        <section>
          <p>
            A <strong>AMG — Centro de Distribuição</strong> trabalha com{" "}
            <strong>atacado e varejo</strong> em produtos de limpeza, higiene,
            EPIs (equipamentos de proteção individual) e variedades, atendendo
            famílias, comércios, indústrias e prestadores de serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            Nossa missão
          </h2>
          <p className="mt-3">
            Oferecer mais praticidade, economia e qualidade, entregando os
            produtos certos com agilidade e bom atendimento. Somos um centro de
            distribuição que une o melhor do atacado e do varejo em um só lugar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            Como atendemos
          </h2>
          <p className="mt-3">
            Neste site você encontra nosso mostruário de produtos. Ao se
            interessar por algum item, o atendimento e a compra acontecem
            diretamente pelo{" "}
            <strong>WhatsApp</strong>, de forma simples e rápida — você combina
            preço, estoque e entrega com a nossa equipe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            Onde estamos
          </h2>
          <p className="mt-3">
            Fazemos entrega própria em São Paulo e enviamos para todo o Brasil.
            Também atendemos retirada na loja para quem preferir.
          </p>
        </section>
      </div>
    </div>
  );
}