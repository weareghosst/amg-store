import type { Metadata } from "next";
import { getStoreSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a AMG — Centro de Distribuição coleta, usa e protege seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).",
};

export default async function PrivacidadePage() {
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getStoreSettings();
  } catch {
    // banco indisponível: usa os padrões (sem contato)
  }

  const lastUpdated = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Última atualização: {lastUpdated}
      </p>

      <div className="prose-amg mt-8 space-y-8 text-slate-700">
        <section>
          <p>
            A <strong>AMG — Centro de Distribuição</strong> respeita a sua
            privacidade e está comprometida em proteger os dados pessoais dos
            seus clientes e visitantes. Esta Política de Privacidade descreve
            como coletamos, utilizamos, armazenamos e protegemos as suas
            informações, em conformidade com a{" "}
            <strong>
              Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº
              13.709/2018)
            </strong>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            1. O que é a LGPD
          </h2>
          <p className="mt-3">
            A Lei Geral de Proteção de Dados (LGPD) é a legislação brasileira
            que regula o tratamento de dados pessoais de pessoas físicas por
            empresas e organizações. Ela garante a você, titular dos dados,
            maior transparência e controle sobre como suas informações são
            utilizadas, além de estabelecer obrigações para quem coleta e trata
            esses dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            2. Quais dados coletamos
          </h2>
          <p className="mt-3">
            Coletamos apenas os dados necessários para atender aos nossos
            serviços de venda e entrega:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <strong>Dados de cadastro:</strong> nome, e-mail, telefone e senha
              (armazenada de forma criptografada).
            </li>
            <li>
              <strong>Dados fiscais:</strong> CPF ou CNPJ, necessários para
              emissão de notas e processamento de pagamentos.
            </li>
            <li>
              <strong>Dados de entrega:</strong> endereço completo e CEP, usados
              para cálculo de frete e envio dos pedidos.
            </li>
            <li>
              <strong>Dados de pedido e pagamento:</strong> histórico de
              compras, valores e forma de pagamento (o processamento financeiro
              é feito por parceiros como o Asaas — não armazenamos dados
              completos de cartão).
            </li>
            <li>
              <strong>Dados de navegação:</strong> cookies e informações
              técnicas (como páginas visitadas), coletados apenas mediante o seu
              consentimento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            3. Como usamos seus dados
          </h2>
          <p className="mt-3">Utilizamos os dados coletados para:</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Processar e entregar seus pedidos;</li>
            <li>Calcular fretes e prazos de entrega;</li>
            <li>Processar pagamentos com segurança;</li>
            <li>
              Gerenciar sua conta e permitir o acesso ao histórico de compras;
            </li>
            <li>
              Enviar comunicações sobre o status do seu pedido e atendimento;
            </li>
            <li>Cumprir obrigações legais e fiscais;</li>
            <li>Melhorar a sua experiência de navegação no site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            4. Cookies
          </h2>
          <p className="mt-3">
            Utilizamos cookies para melhorar sua experiência de navegação e
            analisar o uso do site. Ao acessar nosso site, você pode aceitar ou
            recusar o uso de cookies não essenciais por meio do aviso exibido na
            tela. Os cookies essenciais, necessários ao funcionamento básico do
            site, são sempre mantidos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            5. Compartilhamento de dados
          </h2>
          <p className="mt-3">
            Não vendemos seus dados pessoais. Compartilhamos informações apenas
            com parceiros essenciais à prestação do serviço, tais como:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <strong>Asaas</strong> — para processamento de pagamentos;
            </li>
            <li>
              <strong>Melhor Envio</strong> — para cotação e envio de pedidos;
            </li>
            <li>
              Autoridades públicas, quando exigido por lei ou ordem judicial.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            6. Seus direitos como titular
          </h2>
          <p className="mt-3">
            De acordo com a LGPD, você tem o direito de, a qualquer momento:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar os dados que possuímos sobre você;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>
              Solicitar a anonimização, bloqueio ou eliminação de dados
              desnecessários;
            </li>
            <li>
              Revogar o consentimento e solicitar a exclusão dos seus dados,
              respeitadas as obrigações legais de guarda;
            </li>
            <li>
              Solicitar a portabilidade dos dados a outro fornecedor de serviço.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            7. Segurança dos dados
          </h2>
          <p className="mt-3">
            Adotamos medidas técnicas e organizacionais para proteger seus dados
            contra acessos não autorizados, perda ou vazamento. As senhas são
            armazenadas de forma criptografada e o acesso às informações é
            restrito a pessoas autorizadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            8. Retenção dos dados
          </h2>
          <p className="mt-3">
            Mantemos seus dados apenas pelo tempo necessário para cumprir as
            finalidades descritas nesta política ou pelo prazo exigido por
            obrigações legais e fiscais. Após esse período, os dados são
            eliminados ou anonimizados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-navy">
            9. Contato
          </h2>
          <p className="mt-3">
            Para exercer seus direitos ou esclarecer dúvidas sobre esta Política
            de Privacidade e o tratamento dos seus dados, entre em contato
            conosco:
          </p>
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
                  {settings.storePhone}
                </a>
              </li>
            )}
            {!settings.storeEmail && !settings.storePhone && (
              <li>Fale conosco pelos nossos canais de atendimento.</li>
            )}
          </ul>
        </section>

        <section>
          <p className="text-sm text-slate-500">
            Esta Política de Privacidade poderá ser atualizada periodicamente.
            Recomendamos que você a consulte regularmente para se manter
            informado sobre como protegemos os seus dados.
          </p>
        </section>
      </div>
    </div>
  );
}
