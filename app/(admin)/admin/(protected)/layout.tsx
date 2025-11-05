import { Suspense } from "react";
import type { ReactNode } from "react";

import AdminBodyClass from "@/components/admin/AdminBodyClass";
import AdminTopbar from "@/components/admin/AdminTopbar";
import SkipLink from "@/components/common/SkipLink";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { requireAdminLayout } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  requireAdminLayout();
  return (
    <ToastProvider>
      <AdminBodyClass />
      <div className="min-h-screen bg-white text-zinc-900">
        <SkipLink href="#admin-main">Ir direto para o conteudo do painel</SkipLink>
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]" role="presentation">
          <aside
            className="border-r border-emerald-100 bg-emerald-50/40"
            aria-label="Navegacao do painel administrativo"
          >
            <Sidebar />
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
    </ToastProvider>
  );
}
