import type { ReactNode } from 'react';
import { requireAdminLayout } from '@/lib/adminAuth';
import { ToastProvider } from '@/components/ui/toast';
import { Sidebar } from '@/components/dashboard/Sidebar';
import AdminBodyClass from '@/components/admin/AdminBodyClass';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  requireAdminLayout();
  return (
    <ToastProvider>
      <AdminBodyClass />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-[var(--accent)] px-3 py-2 text-[var(--accent-contrast)]"
        >
          Pular para o conteudo
        </a>
        <div className="lg:flex lg:items-stretch">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <main id="main" className="flex-1 overflow-y-auto focus:outline-none">
              {children}
            </main>
            <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-[12px] text-[var(--text-muted)]">
              <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--text)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold">
                    BI
                  </span>
                  <div className="leading-tight">
                    <strong className="text-sm text-[var(--text)]">By Imperio Dog Admin</strong>
                    <p className="text-[11px] text-[var(--text-muted)]">Ferramentas internas para acelerar publicacoes e operacoes.</p>
                  </div>
                </div>
                <nav aria-label="Links administrativos" className="flex flex-wrap items-center gap-3 text-[11px]">
                  <a href="/admin/support" className="transition hover:text-[var(--text)]">Suporte</a>
                  <a href="/admin/settings" className="transition hover:text-[var(--text)]">Preferencias</a>
                  <a href="/admin/blog" className="transition hover:text-[var(--text)]">Blog</a>
                </nav>
                <span>
                  {"\u00A9"} {new Date().getFullYear()} By Imperio Dog
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
