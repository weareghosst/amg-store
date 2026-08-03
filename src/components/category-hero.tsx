import { existsSync } from "fs";
import path from "path";
import Image from "next/image";

const hasOldLogo = existsSync(path.join(process.cwd(), "public", "logo-old.png"));

export function CategoryHero({
  title,
  tagline,
  background,
  accent,
}: {
  title: string;
  tagline: string;
  background: string;
  accent?: {
    from: string;
    via: string;
    to: string;
    textClass: string;
    mutedTextClass: string;
  };
}) {
  const textClass = accent?.textClass ?? "text-white";
  const mutedTextClass = accent?.mutedTextClass ?? "text-white/85";
  const overlayOpacity = accent ? 0.7 : 1;
  const overlayGradient = accent
    ? `linear-gradient(90deg, ${accent.from} 0%, ${accent.via} 55%, ${accent.to} 100%)`
    : "linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 55%, rgba(15, 23, 42, 0.3) 100%)";

  return (
    <section className="relative flex min-h-[42vh] items-center overflow-hidden bg-brand-navy sm:min-h-[52vh]">
      {/* Fundo com scroll fixo (parallax) e fade nas bordas pro azul marinho */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-60"
        style={{ backgroundImage: `url('${background}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: overlayGradient,
          opacity: overlayOpacity,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-brand-navy to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-brand-navy to-transparent" />

      <div className={`relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center sm:flex-row sm:gap-8 sm:text-left ${textClass}`}>
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
          <p className={`mt-3 max-w-xl sm:text-lg ${mutedTextClass}`}>{tagline}</p>
        </div>
      </div>
    </section>
  );
}
