import type { Metadata } from "next";
import { Suspense } from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import SkipLink from "@/components/common/SkipLink";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — By Império Dog",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <SkipLink />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-emerald-100 bg-emerald-50/40" aria-label="Navegação do admin">
          <AdminSidebar />
        </aside>
        <div className="flex min-h-screen flex-col">
          <AdminTopbar />
          <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8" role="main" tabIndex={-1}>
            <Suspense fallback={<div className="animate-pulse text-sm text-zinc-500">Carregando…</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
