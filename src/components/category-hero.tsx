import { existsSync } from "fs";
import path from "path";
import Image from "next/image";

const hasOldLogo = existsSync(path.join(process.cwd(), "public", "logo-old.png"));

export function CategoryHero({
  title,
  tagline,
  background,
}: {
  title: string;
  tagline: string;
  background: string;
}) {
  return (
    <section className="relative flex min-h-[42vh] items-center overflow-hidden bg-brand-navy sm:min-h-[52vh]">
      {/* Fundo com scroll fixo (parallax) e fade nas bordas pro azul marinho */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-40"
        style={{ backgroundImage: `url('${background}')` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/70 to-brand-navy/30" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-brand-navy to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-brand-navy to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center text-white sm:flex-row sm:gap-8 sm:text-left">
        {hasOldLogo && (
          <Image
            src="/logo-old.png"
            alt="AMG — Produtos de Limpeza e Variedades"
            width={176}
            height={176}
            className="h-32 w-32 shrink-0 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-40 sm:w-40"
            priority
          />
        )}
        <div>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-white/85 sm:text-lg">{tagline}</p>
        </div>
      </div>
    </section>
  );
}
