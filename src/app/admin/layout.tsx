import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificação real de autorização (o proxy só faz triagem de cookie).
  // Cada server action do admin revalida por conta própria via assertAdmin().
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          Painel AMG
        </p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
