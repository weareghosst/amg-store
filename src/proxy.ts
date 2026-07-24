import { NextRequest, NextResponse } from "next/server";

/**
 * Camada de borda (executa antes de tudo):
 *  - Redireciona /admin sem cookie de sessão (conveniência + reduz superfície).
 *    A autorização REAL (papel admin) é verificada de novo no servidor, em cada
 *    página e em cada server action — nunca confie apenas nesta camada.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const hasSession = req.cookies.has("amg_session");
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/entrar";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
