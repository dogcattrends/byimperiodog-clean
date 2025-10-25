import type { Metadata } from "next";
import { Suspense } from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import SkipLink from "@/components/common/SkipLink";

export const metadata: Metadata = {
  title: {
    default: "Admin | By Imperio Dog",
    template: "%s | Admin • By Imperio Dog",
  },
  description: "Painel administrativo interno da By Imperio Dog.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  },
  openGraph: undefined,
  twitter: undefined,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <SkipLink href="#admin-main">Ir direto para o conteudo do painel</SkipLink>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]" role="presentation">
        <aside
          className="border-r border-emerald-100 bg-emerald-50/40"
          aria-label="Navegacao do painel administrativo"
        >
          <AdminSidebar />
        </aside>
        <div className="flex min-h-screen flex-col" role="presentation">
          <AdminTopbar />
          <main
            id="admin-main"
            className="flex-1 p-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-6 lg:p-8"
            role="main"
            tabIndex={-1}
          >
            <Suspense
              fallback={
                <div className="animate-pulse text-sm text-zinc-500" aria-live="polite">
                  Carregando...
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

