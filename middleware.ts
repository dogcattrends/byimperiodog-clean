import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Middleware: força www em produção e mantém regras básicas do admin.
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // 1) Forçar www apenas em produção (quando NEXT_PUBLIC_SITE_URL aponta para www)
  const targetBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const shouldForceWww = targetBase.startsWith("https://www.");
  const { pathname } = url;
  // Redirect canonical de /authors -> /autores (unificar idioma)
  if (pathname.startsWith('/authors')) {
    url.pathname = pathname.replace(/^\/authors/, '/autores');
    return NextResponse.redirect(url, 308);
  }
  if (!pathname.startsWith('/api') && shouldForceWww && url.hostname === targetBase.replace(/^https?:\/\//, "").replace(/^www\./, "") ) {
    // sem www (naked) -> redireciona para www
    url.hostname = `www.${url.hostname}`;
    return NextResponse.redirect(url, 308);
  }

  // 2) Regras de admin básicas (espelhando a versão antiga)
  
  const adm = req.cookies.get("adm")?.value || "";
  const authedCookie = adm === "true" || adm === "1";

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authedCookie) {
      const to = req.nextUrl.clone();
      to.pathname = "/admin/login";
      return NextResponse.redirect(to);
    }
  }

  if (pathname === "/admin/login" && authedCookie) {
    const to = req.nextUrl.clone();
    to.pathname = "/admin/dashboard";
    return NextResponse.redirect(to);
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
    const headerPass = req.headers.get("x-admin-pass");
    const authedHeader = !!expected && headerPass === expected;
    if (!(authedCookie || authedHeader)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  // 3) X-Robots-Tag para rotas de admin (SEO: noindex, nofollow)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Aplica em tudo, exceto assets estáticos comuns
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
