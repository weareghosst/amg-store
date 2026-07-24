import { existsSync } from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { getStoreSettings, DEFAULT_SETTINGS } from "@/lib/settings";

const hasFadeImage = existsSync(path.join(process.cwd(), "public", "fade.jpg"));
const hasOldLogo = existsSync(path.join(process.cwd(), "public", "logo-old.png"));

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export async function Footer() {
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getStoreSettings();
  } catch {
    // banco indisponível: usa os padrões (sem contato)
  }

  return (
    <footer className="mt-auto bg-brand-navy text-white">
      {/* Faixa com a foto de produtos em fade, mesclada com a logo redonda */}
      {hasFadeImage && (
        <section className="relative overflow-hidden">
          <Image
            src="/fade.jpg"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover object-right opacity-40"
          />
          {/* Degradês que fundem a foto no azul marinho do rodapé */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/70 to-brand-navy/20" />
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-brand-navy" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 sm:flex-row sm:gap-10">
            {hasOldLogo && (
              <Image
                src="/logo-old.png"
                alt="AMG — Produtos de Limpeza e Variedades"
                width={176}
                height={176}
                className="h-36 w-36 shrink-0 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-44 sm:w-44"
              />
            )}
            <div className="text-center sm:text-left">
              <p className="text-2xl font-black leading-tight sm:text-3xl">
                Mais praticidade, mais economia,
                <br className="hidden sm:block" />{" "}
                <span className="text-brand-green brightness-150">
                  mais qualidade pra você!
                </span>
              </p>
              <p className="mt-3 max-w-lg text-sm text-white/75">
                Atacado e varejo em produtos de limpeza, higiene, EPIs e
                piscina. Entrega própria em São Paulo e envio para todo o
                Brasil.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-xl font-black tracking-tight">
            AMG <span className="text-brand-green">•</span>
          </p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-white/80">
            Produtos de Limpeza e Variedades
          </p>
          <p className="mt-2 text-sm text-white/60">
            Atacado e varejo — Centro de Distribuição.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-brand-green">
            Entrega
          </p>
          <p className="mt-2 text-white/70">
            🚚 Entrega própria em São Paulo
            <br />
            📦 Envio para todo o Brasil via Melhor Envio
            <br />
            🔒 Pagamento seguro com Pix, boleto ou cartão
          </p>
        </div>

        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-brand-green">
            Contato
          </p>
          <div className="mt-2 flex flex-col gap-1 text-white/70">
            {settings.storePhone && (
              <a
                href={`https://wa.me/55${settings.storePhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-brand-green"
              >
                WhatsApp: {formatPhoneDisplay(settings.storePhone)}
              </a>
            )}
            {settings.storeEmail && (
              <a
                href={`mailto:${settings.storeEmail}`}
                className="transition hover:text-brand-green"
              >
                {settings.storeEmail}
              </a>
            )}
            {!settings.storePhone && !settings.storeEmail && (
              <p>Fale conosco pelo WhatsApp.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} AMG — Centro de Distribuição. Todos os
            direitos reservados.{" "}
            <Link
              href="/privacidade"
              className="font-semibold text-white/70 underline transition hover:text-brand-green"
            >
              Política de Privacidade
            </Link>
          </p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://weareghost.sbs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-green transition hover:text-white"
            >
              WeAreGhost
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
