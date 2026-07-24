import { existsSync } from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { CartBadge } from "./cart/cart-badge";
import { logoutAction } from "@/actions/auth";
import { categoryHref } from "@/lib/category-pages";

// Usa o wordmark oficial se public/logo-header.png existir; caso contrário
// mostra o texto estilizado nas cores da marca.
const hasLogo = existsSync(path.join(process.cwd(), "public", "logo-header.png"));

const CATEGORY_LINKS = [
  { label: "Limpeza & Higiene", slug: "limpeza-higiene" },
  { label: "EPI", slug: "epi" },
  { label: "Piscina", slug: "piscina" },
];

export async function Header() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // banco indisponível não deve derrubar o site inteiro
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center gap-3">
          {hasLogo ? (
            <Image
              src="/logo-header.png"
              alt="AMG — Produtos de Limpeza e Variedades"
              width={132}
              height={65}
              className="h-12 w-auto object-contain transition hover:scale-105 sm:h-14"
              priority
            />
          ) : (
            <span className="text-3xl font-black tracking-tight text-brand-blue">
              AMG
            </span>
          )}
          <span className="hidden leading-tight md:block">
            <span className="block text-xs font-black uppercase tracking-widest text-brand-navy">
              Centro de Distribuição
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-slate-500">
              Produtos de limpeza e variedades
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <CartBadge />
          {user ? (
            <div className="flex items-center gap-1">
              <Link
                href="/conta"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Minha conta
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-brand-navy px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-blue-dark"
                >
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/entrar"
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>

      {/* Barra de categorias */}
      <div className="bg-gradient-to-r from-brand-blue-dark to-brand-blue">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4">
          <Link
            href="/produtos"
            className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Todos os produtos
          </Link>
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.slug}
              href={categoryHref(c.slug)}
              className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
